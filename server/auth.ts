import express, { Request, Response, NextFunction } from 'express';
import { hashPassword, verifyPassword, generateToken, hashToken } from './password.js';
import { normalizeEmail, validateEmail, validateName, validatePassword } from '../lib/validation.js';
import { sanitizeSettings } from '../lib/optimizationSettings.js';
import { User, Session, PasswordReset, OptimizationRecord } from './models.js';
import { connectDb, isDbConfigured } from './db.js';
import { rateLimit } from './rateLimit.js';
import { resetDeliveryMode, sendEmail, passwordResetEmail } from './email.js';
import { apiErrorHandler } from './errors.js';

export { User, Session, PasswordReset };

// --- Config ---
const DAY = 24 * 60 * 60 * 1000;
const REMEMBER_TTL = 30 * DAY;
const SESSION_TTL = DAY;
const RESET_TTL_MIN = 60;
const RESET_TTL = RESET_TTL_MIN * 60 * 1000;

export const isSecureCookie = () => process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production';

// `__Host-` cookies must be Secure, host-only and path=/ — the browser enforces it.
// Plain HTTP (local development) can't use the prefix.
export const sessionCookieName = () => (isSecureCookie() ? '__Host-op_session' : 'op_session');

// Used to keep login timing similar whether or not the email exists.
let dummyHash: Promise<string> | null = null;

// --- Helpers ---
export const parseCookies = (header: string | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (!key || key in out) continue;
    try { out[key] = decodeURIComponent(part.slice(idx + 1).trim()); } catch { /* ignore malformed */ }
  }
  return out;
};

const publicUser = (u: any) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  plan: u.plan || 'free',
  createdAt: u.createdAt,
  preferences: { optimization: sanitizeSettings(u.preferences?.optimization) },
});

const setSessionCookie = (res: Response, token: string, remember: boolean) => {
  res.cookie(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
    path: '/',
    ...(remember ? { maxAge: REMEMBER_TTL } : {}),
  });
};

const clearSessionCookie = (res: Response) => {
  res.clearCookie(sessionCookieName(), { httpOnly: true, sameSite: 'lax', secure: isSecureCookie(), path: '/' });
};

const readSessionToken = (req: Request) => parseCookies(req.headers.cookie)[sessionCookieName()];

const createSession = async (req: Request, res: Response, userId: unknown, remember: boolean) => {
  // Rotate: a session token that existed before sign-in is never reused (prevents fixation).
  const previous = readSessionToken(req);
  if (previous) await Session.deleteOne({ tokenHash: hashToken(previous) });
  const token = generateToken();
  await Session.create({ tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + (remember ? REMEMBER_TTL : SESSION_TTL)) });
  setSessionCookie(res, token, remember);
};

// Reject cross-site writes: require JSON bodies and a same-origin Origin header when present.
export const sameOriginJson = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  const origin = req.headers.origin;
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch { /* invalid */ }
    if (host !== req.headers.host) return res.status(403).json({ error: 'Cross-origin request rejected.' });
  }
  if (req.headers['content-length'] && req.headers['content-length'] !== '0' && !req.is('application/json')) {
    return res.status(415).json({ error: 'Expected a JSON request body.' });
  }
  next();
};

/** Ensures MongoDB is connected; answers 503 with a clear message otherwise (never a fake success). */
export const ensureDb = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDb();
    next();
  } catch {
    const message = isDbConfigured()
      ? 'The account service is temporarily unavailable. Please try again in a moment.'
      : 'Accounts are not available on this deployment yet (database not configured).';
    res.status(503).json({ error: message, code: isDbConfigured() ? 'db_unavailable' : 'db_not_configured' });
  }
};

const loadSession = async (req: Request) => {
  const token = readSessionToken(req);
  if (!token) return null;
  const session = await Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await User.findById(session.userId);
  if (!user) return null;
  return { session, user };
};

export interface AuthContext { session: any; user: any }
export const authOf = (req: Request) => (req as any).auth as AuthContext;

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = await loadSession(req);
    if (!auth) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Your session has ended. Please sign in again.', code: 'unauthenticated' });
    }
    (req as any).auth = auth;
    next();
  } catch (err) {
    next(err);
  }
};

// Express 5 forwards rejected promises to the error handler.
type Handler = (req: Request, res: Response) => Promise<unknown>;
export const h = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

const emailKey = (req: Request) => normalizeEmail(req.body?.email) || null;

const resetOrigin = (req: Request): string | null => {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  // In production the Host header is attacker-controlled, so links are only built from APP_URL.
  if (process.env.NODE_ENV === 'production') return null;
  return `${req.protocol}://${req.headers.host}`;
};

// --- Router ---
export interface AuthRouterOptions {
  /** Max attempts per IP (and per email) per window: login (15 min), signup (1 h), password reset (1 h). */
  limits?: { login?: number; signup?: number; reset?: number };
  /** Namespace for rate-limit counters (lets tests run routers with independent limits). */
  limitPrefix?: string;
}

export const createAuthRouter = ({ limits = {}, limitPrefix = 'auth' }: AuthRouterOptions = {}) => {
  const router = express.Router();
  router.use(express.json({ limit: '10kb' }));
  router.use(sameOriginJson);
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  router.use(ensureDb);

  const L = (n: string) => `${limitPrefix}:${n}`;
  const loginLimiter = rateLimit(L('login'), limits.login ?? 10, 15 * 60 * 1000, emailKey);
  const sensitiveLimiter = rateLimit(L('sensitive'), limits.login ?? 10, 15 * 60 * 1000);
  const signupLimiter = rateLimit(L('signup'), limits.signup ?? 10, 60 * 60 * 1000);
  const resetLimiter = rateLimit(L('reset'), limits.reset ?? 5, 60 * 60 * 1000, emailKey);

  router.post('/signup', signupLimiter, h(async (req, res) => {
    const { name, password } = req.body || {};
    const email = normalizeEmail(req.body?.email);
    const errors: Record<string, string> = {};
    const nameErr = validateName(name); if (nameErr) errors.name = nameErr;
    const emailErr = validateEmail(email); if (emailErr) errors.email = emailErr;
    const pwErr = validatePassword(password, email); if (pwErr) errors.password = pwErr;
    if (req.body?.acceptTerms !== true) errors.acceptTerms = 'Please accept the Terms of Service and Privacy Policy.';
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: errors });

    const duplicate = { error: 'An account with this email already exists.', fields: { email: 'An account with this email already exists. Try signing in instead.' } };
    if (await User.exists({ email })) return res.status(409).json(duplicate);
    let user;
    try {
      user = await User.create({ name: name.trim(), email, passwordHash: await hashPassword(password), termsAcceptedAt: new Date() });
    } catch (err: any) {
      // The unique index is the real guard under concurrent signups.
      if (err?.code === 11000) return res.status(409).json(duplicate);
      throw err;
    }
    await createSession(req, res, user._id, true);
    res.status(201).json({ user: publicUser(user) });
  }));

  router.post('/login', loginLimiter, h(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const remember = req.body?.remember === true;
    if (!email || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Enter your email and password.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      dummyHash ??= hashPassword('timing-equalizer');
      await verifyPassword(password, await dummyHash);
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    await createSession(req, res, user._id, remember);
    res.json({ user: publicUser(user) });
  }));

  router.post('/logout', h(async (req, res) => {
    const token = readSessionToken(req);
    if (token) {
      if (req.body?.everywhere === true) {
        const s = await Session.findOne({ tokenHash: hashToken(token) });
        if (s) await Session.deleteMany({ userId: s.userId });
      } else {
        await Session.deleteOne({ tokenHash: hashToken(token) });
      }
    }
    clearSessionCookie(res);
    res.status(204).end();
  }));

  // Signed-out visitors get { user: null } (not 401) so the public site doesn't log errors.
  router.get('/me', h(async (req, res) => {
    const auth = await loadSession(req);
    if (!auth && readSessionToken(req)) clearSessionCookie(res);
    res.json({ user: auth ? publicUser(auth.user) : null });
  }));

  router.patch('/me', requireAuth, h(async (req, res) => {
    const nameErr = validateName(req.body?.name);
    if (nameErr) return res.status(400).json({ error: nameErr, fields: { name: nameErr } });
    const { user } = authOf(req);
    user.name = req.body.name.trim();
    await user.save();
    res.json({ user: publicUser(user) });
  }));

  // Default optimizer settings. `null` resets to the built-in defaults.
  router.put('/preferences', requireAuth, h(async (req, res) => {
    const raw = req.body?.optimization;
    const optimization = raw === null ? null : sanitizeSettings(raw);
    if (raw !== null && !optimization) return res.status(400).json({ error: 'These optimization settings are not valid.' });
    const { user } = authOf(req);
    user.set('preferences.optimization', optimization);
    await user.save();
    res.json({ user: publicUser(user) });
  }));

  router.post('/change-password', requireAuth, sensitiveLimiter, h(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    const { user, session } = authOf(req);
    if (typeof currentPassword !== 'string' || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return res.status(400).json({ error: 'Your current password is incorrect.', fields: { currentPassword: 'Your current password is incorrect.' } });
    }
    const pwErr = validatePassword(newPassword, user.email);
    if (pwErr) return res.status(400).json({ error: pwErr, fields: { newPassword: pwErr } });
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    // Keep this session, sign out all others, and void outstanding reset links.
    await Session.deleteMany({ userId: user._id, _id: { $ne: session._id } });
    await PasswordReset.deleteMany({ userId: user._id });
    res.status(204).end();
  }));

  // Permanently deletes the account and everything tied to it.
  router.delete('/me', requireAuth, sensitiveLimiter, h(async (req, res) => {
    const { user } = authOf(req);
    const password = req.body?.password;
    if (typeof password !== 'string' || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(400).json({ error: 'Your password is incorrect.', fields: { password: 'Your password is incorrect.' } });
    }
    await OptimizationRecord.deleteMany({ userId: user._id });
    await PasswordReset.deleteMany({ userId: user._id });
    await Session.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    clearSessionCookie(res);
    res.status(204).end();
  }));

  router.post('/forgot-password', resetLimiter, h(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr, fields: { email: emailErr } });

    const delivery = resetDeliveryMode();
    const origin = resetOrigin(req);
    const canDeliver = delivery !== 'unavailable' && origin !== null;
    if (!canDeliver) {
      console.warn(`[auth] Password reset requested but cannot be delivered (${delivery === 'unavailable' ? 'email provider not configured' : 'APP_URL not set'}).`);
    } else {
      const user = await User.findOne({ email });
      if (user) {
        const token = generateToken();
        await PasswordReset.deleteMany({ userId: user._id });
        await PasswordReset.create({ tokenHash: hashToken(token), userId: user._id, expiresAt: new Date(Date.now() + RESET_TTL) });
        const link = `${origin}/reset-password?token=${token}`;
        if (delivery === 'email') {
          try {
            await sendEmail(passwordResetEmail(user.email, user.name, link, RESET_TTL_MIN));
          } catch (err: any) {
            // Logged for operators; the response stays generic so it can't reveal that the account exists.
            console.error('[auth] Failed to send password reset email:', err?.message || err);
          }
        } else {
          console.log(`[auth] Password reset link for ${email}: ${link}`);
        }
      }
    }
    // Same response whether or not the account exists. `delivery` reflects only server configuration.
    res.json({ ok: true, delivery: canDeliver ? delivery : 'unavailable' });
  }));

  router.post('/reset-password', resetLimiter, h(async (req, res) => {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || !token || token.length > 200) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ error: pwErr, fields: { password: pwErr } });
    const reset = await PasswordReset.findOneAndDelete({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
    if (!reset) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    const user = await User.findById(reset.userId);
    if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    const emailErr = validatePassword(password, user.email);
    if (emailErr) {
      // Token was consumed by findOneAndDelete; put it back so the user can retry with a different password.
      await PasswordReset.create({ tokenHash: reset.tokenHash, userId: reset.userId, expiresAt: reset.expiresAt });
      return res.status(400).json({ error: emailErr, fields: { password: emailErr } });
    }
    user.passwordHash = await hashPassword(password);
    await user.save();
    await Session.deleteMany({ userId: user._id });
    await PasswordReset.deleteMany({ userId: user._id });
    res.status(204).end();
  }));

  router.use(apiErrorHandler);
  return router;
};
