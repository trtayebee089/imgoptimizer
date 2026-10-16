import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { hashPassword, verifyPassword, generateToken, hashToken } from './password';
import { normalizeEmail, validateEmail, validateName, validatePassword } from '../lib/validation';

// --- Schemas ---
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  // The product is free; the plan field exists so the UI can show the real plan.
  plan: { type: String, enum: ['free'], default: 'free' },
}, { timestamps: true });

const SessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

const PasswordResetSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const User: mongoose.Model<any> = mongoose.models.User || mongoose.model('User', UserSchema);
export const Session: mongoose.Model<any> = mongoose.models.Session || mongoose.model('Session', SessionSchema);
export const PasswordReset: mongoose.Model<any> = mongoose.models.PasswordReset || mongoose.model('PasswordReset', PasswordResetSchema);

// --- Config ---
export const SESSION_COOKIE = 'op_session';
const DAY = 24 * 60 * 60 * 1000;
const REMEMBER_TTL = 30 * DAY;
const SESSION_TTL = DAY;
const RESET_TTL = 60 * 60 * 1000;

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

const publicUser = (u: any) => ({ id: String(u._id), name: u.name, email: u.email, plan: u.plan || 'free', createdAt: u.createdAt });

const isSecureCookie = () => process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production';

const setSessionCookie = (res: Response, token: string, remember: boolean) => {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
    path: '/',
    ...(remember ? { maxAge: REMEMBER_TTL } : {}),
  });
};

const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: isSecureCookie(), path: '/' });
};

const createSession = async (res: Response, userId: unknown, remember: boolean) => {
  const token = generateToken();
  await Session.create({ tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + (remember ? REMEMBER_TTL : SESSION_TTL)) });
  setSessionCookie(res, token, remember);
};

/** Small in-memory fixed-window limiter (per process). */
const createLimiter = (max: number, windowMs: number) => {
  const hits = new Map<string, { count: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      if (hits.size > 10000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
    }
    next();
  };
};

// Reject cross-site writes: require JSON bodies and a same-origin Origin header when present.
const sameOriginJson = (req: Request, res: Response, next: NextFunction) => {
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

const requireDb = (_req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'The account service is temporarily unavailable. Please try again later.' });
  }
  next();
};

const loadSession = async (req: Request) => {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  const session = await Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await User.findById(session.userId);
  if (!user) return null;
  return { session, user };
};

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = await loadSession(req);
    if (!auth) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'You are not signed in.' });
    }
    (req as any).auth = auth;
    next();
  } catch (err) {
    next(err);
  }
};

// Express 5 forwards rejected promises to the error handler.
type Handler = (req: Request, res: Response) => Promise<unknown>;
const h = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// --- Router ---
export interface AuthRouterOptions {
  /** Max attempts per IP per window: login (15 min), signup (1 h), password reset (1 h). */
  limits?: { login?: number; signup?: number; reset?: number };
}

export const createAuthRouter = ({ limits = {} }: AuthRouterOptions = {}) => {
  const router = express.Router();
  router.use(express.json({ limit: '10kb' }));
  router.use(sameOriginJson);
  router.use(requireDb);
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

  const loginLimiter = createLimiter(limits.login ?? 10, 15 * 60 * 1000);
  const passwordChangeLimiter = createLimiter(limits.login ?? 10, 15 * 60 * 1000);
  const signupLimiter = createLimiter(limits.signup ?? 10, 60 * 60 * 1000);
  const resetLimiter = createLimiter(limits.reset ?? 5, 60 * 60 * 1000);

  router.post('/signup', signupLimiter, h(async (req, res) => {
    const { name, password } = req.body || {};
    const email = normalizeEmail(req.body?.email);
    const errors: Record<string, string> = {};
    const nameErr = validateName(name); if (nameErr) errors.name = nameErr;
    const emailErr = validateEmail(email); if (emailErr) errors.email = emailErr;
    const pwErr = validatePassword(password); if (pwErr) errors.password = pwErr;
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: errors });

    if (await User.exists({ email })) {
      return res.status(409).json({ error: 'An account with this email already exists.', fields: { email: 'An account with this email already exists.' } });
    }
    let user;
    try {
      user = await User.create({ name: name.trim(), email, passwordHash: await hashPassword(password) });
    } catch (err: any) {
      if (err?.code === 11000) return res.status(409).json({ error: 'An account with this email already exists.', fields: { email: 'An account with this email already exists.' } });
      throw err;
    }
    await createSession(res, user._id, true);
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
    await createSession(res, user._id, remember);
    res.json({ user: publicUser(user) });
  }));

  router.post('/logout', h(async (req, res) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
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
    if (!auth && parseCookies(req.headers.cookie)[SESSION_COOKIE]) clearSessionCookie(res);
    res.json({ user: auth ? publicUser(auth.user) : null });
  }));

  router.patch('/me', requireAuth, h(async (req, res) => {
    const nameErr = validateName(req.body?.name);
    if (nameErr) return res.status(400).json({ error: nameErr, fields: { name: nameErr } });
    const user = (req as any).auth.user;
    user.name = req.body.name.trim();
    await user.save();
    res.json({ user: publicUser(user) });
  }));

  router.post('/change-password', requireAuth, passwordChangeLimiter, h(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    const { user, session } = (req as any).auth;
    if (typeof currentPassword !== 'string' || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return res.status(400).json({ error: 'Your current password is incorrect.', fields: { currentPassword: 'Your current password is incorrect.' } });
    }
    const pwErr = validatePassword(newPassword);
    if (pwErr) return res.status(400).json({ error: pwErr, fields: { newPassword: pwErr } });
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    // Keep this session, sign out all others.
    await Session.deleteMany({ userId: user._id, _id: { $ne: session._id } });
    res.status(204).end();
  }));

  router.post('/forgot-password', resetLimiter, h(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr, fields: { email: emailErr } });

    // No email provider is configured in this project. Reset links are only
    // written to the server log outside production (or when explicitly enabled).
    const logLinks = process.env.NODE_ENV !== 'production' || process.env.AUTH_LOG_RESET_LINKS === 'true';
    const user = await User.findOne({ email });
    if (user) {
      const token = generateToken();
      await PasswordReset.deleteMany({ userId: user._id });
      await PasswordReset.create({ tokenHash: hashToken(token), userId: user._id, expiresAt: new Date(Date.now() + RESET_TTL) });
      const origin = process.env.APP_URL || `${req.protocol}://${req.headers.host}`;
      const link = `${origin}/reset-password?token=${token}`;
      if (logLinks) {
        console.log(`[auth] Password reset link for ${email}: ${link}`);
      } else {
        console.warn('[auth] Password reset requested, but no email delivery is configured.');
      }
    }
    // Same response whether or not the account exists. `delivery` tells the UI
    // honestly how (or whether) the link can reach the user.
    res.json({ ok: true, delivery: logLinks ? 'server-log' : 'unavailable' });
  }));

  router.post('/reset-password', resetLimiter, h(async (req, res) => {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || !token) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ error: pwErr, fields: { password: pwErr } });
    const reset = await PasswordReset.findOneAndDelete({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
    if (!reset) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    const user = await User.findById(reset.userId);
    if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    user.passwordHash = await hashPassword(password);
    await user.save();
    await Session.deleteMany({ userId: user._id });
    res.status(204).end();
  }));

  router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body.' });
    console.error('[auth] Unexpected error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  return router;
};
