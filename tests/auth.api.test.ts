// Integration tests for /api/auth and /api/history against a real MongoDB.
// Set MONGODB_URI_TEST (a throwaway database — it is dropped afterwards), or run
// `npm run test:integration`, which starts a temporary in-memory MongoDB.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import type { AddressInfo } from 'net';
import { createAuthRouter, PasswordReset, Session, User } from '../server/auth';
import { createHistoryRouter } from '../server/history';
import { OptimizationRecord } from '../server/models';
import { hashToken, generateToken } from '../server/password';
import { createApp } from '../server/app';

const MONGO = process.env.MONGODB_URI_TEST;
const skip = !MONGO && 'MONGODB_URI_TEST not set';

let base = '';
let server: ReturnType<express.Express['listen']> | undefined;
let resetLinks: string[] = [];
const originalLog = console.log;

/** Tiny client with a cookie jar for one "browser". `.at(prefix)` shares the same jar. */
type Init = { method?: string; body?: unknown; headers?: Record<string, string> };
const client = (prefix = '/api/auth', jar = { cookie: '' }) => {
  const call = async (path: string, init: Init = {}) => {
    const res = await fetch(base + prefix + path, {
      method: init.method || 'GET',
      headers: { ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(jar.cookie ? { Cookie: jar.cookie } : {}), ...init.headers },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) {
      const [pair] = set.split(';');
      jar.cookie = pair.endsWith('=') ? '' : pair;
    }
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, setCookie: set, cookie: () => jar.cookie };
  };
  return Object.assign(call, { cookie: () => jar.cookie, at: (p: string) => client(p, jar) });
};

const signup = (c: ReturnType<typeof client>, email: string, password = 'analytical-engine', name = 'Test User') =>
  c('/signup', { method: 'POST', body: { name, email, password, acceptTerms: true } });

const record = (over: Record<string, unknown> = {}) => ({ status: 'optimized', originalBytes: 1000, outputBytes: 250, inputFormat: 'jpeg', outputFormat: 'webp', mode: 'smart', ...over });

before(async () => {
  if (skip) return;
  process.env.MONGODB_URI = MONGO;
  await mongoose.connect(MONGO!);
  await mongoose.connection.dropDatabase();
  await mongoose.connection.syncIndexes();
  const app = express();
  app.use('/api/auth', createAuthRouter({ limits: { login: 1000, signup: 1000, reset: 1000 } }));
  app.use('/api/auth-limited', createAuthRouter({ limits: { login: 3 }, limitPrefix: 'limited' }));
  app.use('/api/history', createHistoryRouter());
  app.use('/real', createApp());
  await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', () => resolve()); });
  base = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
  console.log = (...args: unknown[]) => {
    const m = String(args[0]).match(/reset-password\?token=(\S+)/);
    if (m) resetLinks.push(m[1]); else originalLog(...args);
  };
});

after(async () => {
  console.log = originalLog;
  if (skip) return;
  server?.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('signup creates an account, sets an httpOnly session cookie, and /me returns the user', { skip }, async () => {
  const c = client();
  const anon = await c('/me');
  assert.equal(anon.status, 200);
  assert.equal(anon.body.user, null);

  const res = await c('/signup', { method: 'POST', body: { name: 'Ada Lovelace', email: 'Ada@Example.com', password: 'analytical-engine', acceptTerms: true } });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, 'ada@example.com');
  assert.equal(res.body.user.plan, 'free');
  assert.equal(res.body.user.passwordHash, undefined, 'password hash is never returned');
  assert.match(res.setCookie!, /op_session=/);
  assert.match(res.setCookie!, /HttpOnly/i);
  assert.match(res.setCookie!, /SameSite=Lax/i);
  assert.doesNotMatch(res.setCookie!, /Domain=/i, 'host-only cookie');

  const me = await c('/me');
  assert.equal(me.body.user.name, 'Ada Lovelace');
  const stored = await User.findOne({ email: 'ada@example.com' }).lean<any>();
  assert.ok(stored.termsAcceptedAt instanceof Date);
  assert.match(stored.passwordHash, /^scrypt\$/);
});

test('signup validates input, requires terms and rejects duplicate emails', { skip }, async () => {
  const c = client();
  const bad = await c('/signup', { method: 'POST', body: { name: '', email: 'nope', password: 'short' } });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.fields.name && bad.body.fields.email && bad.body.fields.password && bad.body.fields.acceptTerms);

  const weak = await c('/signup', { method: 'POST', body: { name: 'W', email: 'weak@example.com', password: 'password123', acceptTerms: true } });
  assert.equal(weak.status, 400);
  assert.ok(weak.body.fields.password);

  const noTerms = await c('/signup', { method: 'POST', body: { name: 'N', email: 'n@example.com', password: 'analytical-engine' } });
  assert.equal(noTerms.status, 400);
  assert.ok(noTerms.body.fields.acceptTerms);

  const dup = await signup(c, 'ADA@example.com');
  assert.equal(dup.status, 409);
});

test('concurrent duplicate signups create exactly one account (unique index)', { skip }, async () => {
  const results = await Promise.all([1, 2, 3].map(() => signup(client(), 'race@example.com')));
  assert.equal(results.filter(r => r.status === 201).length, 1);
  assert.ok(results.filter(r => r.status !== 201).every(r => r.status === 409));
  assert.equal(await User.countDocuments({ email: 'race@example.com' }), 1);
});

test('login rejects wrong credentials with a generic message and accepts correct ones', { skip }, async () => {
  const c = client();
  const wrong = await c('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'wrong-password' } });
  const unknown = await c('/login', { method: 'POST', body: { email: 'nobody@example.com', password: 'whatever-123' } });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.error, unknown.body.error);

  const ok = await c('/login', { method: 'POST', body: { email: 'ADA@example.com', password: 'analytical-engine', remember: false } });
  assert.equal(ok.status, 200);
  assert.doesNotMatch(ok.setCookie!, /Max-Age|Expires/i, 'non-remembered login uses a session cookie');

  const remembered = await client()('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'analytical-engine', remember: true } });
  assert.match(remembered.setCookie!, /Max-Age=2592000/);
});

test('signing in rotates the session token (no fixation)', { skip }, async () => {
  const c = client();
  await c('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'analytical-engine' } });
  const first = c.cookie();
  const again = await c('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'analytical-engine' } });
  assert.notEqual(again.cookie(), first);
  const replay = await fetch(base + '/api/auth/me', { headers: { Cookie: first } }).then(r => r.json());
  assert.equal(replay.user, null, 'the pre-login token was revoked');
});

test('logout invalidates the session server-side', { skip }, async () => {
  const c = client();
  const login = await c('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'analytical-engine' } });
  const stolen = login.cookie();
  assert.ok(stolen);
  const out = await c('/logout', { method: 'POST', body: {} });
  assert.equal(out.status, 204);
  assert.equal((await c('/me')).body.user, null);
  const replay = await fetch(base + '/api/auth/me', { headers: { Cookie: stolen } }).then(r => r.json());
  assert.equal(replay.user, null);
});

test('expired sessions are rejected', { skip }, async () => {
  const user = await User.findOne({ email: 'ada@example.com' });
  const token = generateToken();
  await Session.create({ tokenHash: hashToken(token), userId: user._id, expiresAt: new Date(Date.now() - 1000) });
  const me = await fetch(base + '/api/auth/me', { headers: { Cookie: `op_session=${token}` } }).then(r => r.json());
  assert.equal(me.user, null);
  const hist = await fetch(base + '/api/history/summary', { headers: { Cookie: `op_session=${token}` } });
  assert.equal(hist.status, 401);
  assert.equal((await hist.json()).code, 'unauthenticated');
});

test('profile, preferences and password change require a session', { skip }, async () => {
  const anon = client();
  assert.equal((await anon('/me', { method: 'PATCH', body: { name: 'X' } })).status, 401);
  assert.equal((await anon('/preferences', { method: 'PUT', body: { optimization: null } })).status, 401);
  assert.equal((await anon('/change-password', { method: 'POST', body: { currentPassword: 'a', newPassword: 'bbbbbbbb' } })).status, 401);

  const c = client();
  const other = client();
  await c('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'analytical-engine' } });
  await other('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'analytical-engine' } });

  const renamed = await c('/me', { method: 'PATCH', body: { name: 'Augusta Ada' } });
  assert.equal(renamed.body.user.name, 'Augusta Ada');

  const prefs = { mode: 'smart', outputFormat: 'jpeg', targetSizeKB: 200, minQuality: 80, minDimension: 1000, useSmartDimension: true, targetQuality: 90 };
  const savedPrefs = await c('/preferences', { method: 'PUT', body: { optimization: prefs } });
  assert.equal(savedPrefs.status, 200);
  assert.equal(savedPrefs.body.user.preferences.optimization.outputFormat, 'jpeg');
  assert.equal((await c('/preferences', { method: 'PUT', body: { optimization: { ...prefs, outputFormat: 'exe' } } })).status, 400);
  assert.equal((await c('/me')).body.user.preferences.optimization.targetSizeKB, 200);
  assert.equal((await c('/preferences', { method: 'PUT', body: { optimization: null } })).body.user.preferences.optimization, null);

  const badCurrent = await c('/change-password', { method: 'POST', body: { currentPassword: 'nope', newPassword: 'new-password-1' } });
  assert.equal(badCurrent.status, 400);
  const changed = await c('/change-password', { method: 'POST', body: { currentPassword: 'analytical-engine', newPassword: 'new-password-1' } });
  assert.equal(changed.status, 204);
  assert.ok((await c('/me')).body.user, 'current session survives');
  assert.equal((await other('/me')).body.user, null, 'other sessions are revoked');
  assert.equal((await client()('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'new-password-1' } })).status, 200);
});

test('forgot/reset password flow uses single-use, hashed, expiring tokens', { skip }, async () => {
  const c = client();
  const unknown = await c('/forgot-password', { method: 'POST', body: { email: 'nobody@example.com' } });
  const known = await c('/forgot-password', { method: 'POST', body: { email: 'ada@example.com' } });
  assert.equal(unknown.status, 200);
  assert.deepEqual(unknown.body, known.body, 'response does not reveal whether the account exists');
  assert.equal(known.body.delivery, 'server-log');
  assert.equal(resetLinks.length, 1);
  const token = resetLinks[0];
  assert.ok(await PasswordReset.exists({ tokenHash: hashToken(token) }));
  assert.equal(await PasswordReset.exists({ tokenHash: token }), null, 'raw token is not stored');

  const loggedIn = client();
  await loggedIn('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'new-password-1' } });

  assert.equal((await c('/reset-password', { method: 'POST', body: { token: 'bogus', password: 'reset-password-1' } })).status, 400);
  assert.equal((await c('/reset-password', { method: 'POST', body: { token, password: 'reset-password-1' } })).status, 204);
  assert.equal((await c('/reset-password', { method: 'POST', body: { token, password: 'reset-password-2' } })).status, 400, 'token is single-use');
  assert.equal((await loggedIn('/me')).body.user, null, 'existing sessions are revoked after reset');
  assert.equal((await c('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'reset-password-1' } })).status, 200);

  // Expired token
  const user = await User.findOne({ email: 'ada@example.com' });
  const expired = generateToken();
  await PasswordReset.create({ tokenHash: hashToken(expired), userId: user._id, expiresAt: new Date(Date.now() - 1000) });
  assert.equal((await c('/reset-password', { method: 'POST', body: { token: expired, password: 'reset-password-3' } })).status, 400, 'expired token is rejected');
});

test('in production without email or APP_URL, reset is reported unavailable and no token is created', { skip }, async () => {
  const prev = { NODE_ENV: process.env.NODE_ENV, APP_URL: process.env.APP_URL, COOKIE_SECURE: process.env.COOKIE_SECURE };
  process.env.NODE_ENV = 'production';
  process.env.COOKIE_SECURE = 'false';
  delete process.env.APP_URL;
  try {
    await PasswordReset.deleteMany({});
    const res = await client()('/forgot-password', { method: 'POST', body: { email: 'ada@example.com' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.delivery, 'unavailable');
    assert.equal(await PasswordReset.countDocuments({}), 0);
  } finally {
    Object.entries(prev).forEach(([k, v]) => { if (v === undefined) delete process.env[k]; else process.env[k] = v; });
  }
});

test('history: authenticated, validated, isolated per user, failures excluded from totals', { skip }, async () => {
  const h = client('/api/history');
  assert.equal((await h('/summary')).status, 401);
  assert.equal((await h('/', { method: 'POST', body: { batchId: 'batch-0000000001', records: [record()] } })).status, 401);

  const alice = client();
  await signup(alice, 'alice@example.com');
  const bob = client();
  await signup(bob, 'bob@example.com');
  const ahc = alice.at('/api/history');
  const bhc = bob.at('/api/history');
  const ah = async (path: string, init: Init = {}) => { const r = await ahc(path, init); return { status: r.status, json: async () => r.body }; };
  const bh = async (path: string, init: Init = {}) => { const r = await bhc(path, init); return { status: r.status, json: async () => r.body }; };

  assert.equal((await ah('/', { method: 'POST', body: { batchId: 'x', records: [record()] } })).status, 400);
  assert.equal((await ah('/', { method: 'POST', body: { batchId: 'batch-aaaaaaaa01', records: [record(), record({ originalBytes: 2000, outputBytes: 500 }), record({ status: 'failed', outputBytes: 0, originalBytes: 9999 })] } })).status, 201);
  assert.equal((await ah('/', { method: 'POST', body: { batchId: 'batch-aaaaaaaa02', records: [record({ originalBytes: 100, outputBytes: 150 })] } })).status, 201);

  const summary = await (await ah('/summary')).json();
  assert.equal(summary.totals.imagesOptimized, 3);
  assert.equal(summary.totals.failed, 1);
  assert.equal(summary.totals.originalBytes, 3100, 'failed files are not counted');
  assert.equal(summary.totals.outputBytes, 900);
  assert.equal(summary.totals.savedBytes, 2200, 'sum(original - optimized), including a file that grew');
  assert.equal(summary.recent.length, 2);
  const first = summary.recent.find((b: any) => b.batchId === 'batch-aaaaaaaa01');
  assert.equal(first.status, 'partial');
  assert.equal(first.images, 2);

  const bobSummary = await (await bh('/summary')).json();
  assert.equal(bobSummary.totals.imagesOptimized, 0, "Bob can't see Alice's history");
  assert.equal(bobSummary.recent.length, 0);

  const page = await (await ah('/batches?page=1&limit=1')).json();
  assert.equal(page.total, 2);
  assert.equal(page.pages, 2);
  assert.equal(page.items.length, 1);

  // Bob clearing his history must not touch Alice's.
  assert.equal((await (await bh('/', { method: 'DELETE' })).json()).deleted, 0);
  assert.equal((await (await ah('/summary')).json()).totals.imagesOptimized, 3);
});

test('account deletion requires the password and removes all user data', { skip }, async () => {
  const c = client();
  await c('/login', { method: 'POST', body: { email: 'alice@example.com', password: 'analytical-engine' } });
  const user = await User.findOne({ email: 'alice@example.com' });
  assert.ok(await OptimizationRecord.countDocuments({ userId: user._id }) > 0);

  assert.equal((await c('/me', { method: 'DELETE', body: { password: 'wrong' } })).status, 400);
  assert.equal((await c('/me', { method: 'DELETE', body: { password: 'analytical-engine' } })).status, 204);
  assert.equal(await User.countDocuments({ _id: user._id }), 0);
  assert.equal(await Session.countDocuments({ userId: user._id }), 0);
  assert.equal(await OptimizationRecord.countDocuments({ userId: user._id }), 0);
  assert.equal((await c('/me')).body.user, null);
  assert.equal((await client()('/login', { method: 'POST', body: { email: 'alice@example.com', password: 'analytical-engine' } })).status, 401);
});

test('cross-origin and non-JSON writes are rejected', { skip }, async () => {
  const c = client();
  const xo = await c('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'reset-password-1' }, headers: { Origin: 'https://evil.example' } });
  assert.equal(xo.status, 403);
  const form = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'email=a&password=b' });
  assert.equal(form.status, 415);
  const malformed = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(malformed.status, 400);
  assert.doesNotMatch(await malformed.text(), /at .*\.ts|stack/i, 'no stack traces');
});

test('login is rate limited (counters live in MongoDB, shared across instances)', { skip }, async () => {
  const c = client('/api/auth-limited');
  let last = 0;
  for (let i = 0; i < 4; i++) {
    last = (await c('/login', { method: 'POST', body: { email: 'ratelimit@example.com', password: 'wrong-password' } })).status;
  }
  assert.equal(last, 429);
  // A second router instance (like another serverless instance) sees the same counters.
  const otherInstance = express();
  otherInstance.use('/api/auth-limited', createAuthRouter({ limits: { login: 3 }, limitPrefix: 'limited' }));
  const srv = await new Promise<any>(resolve => { const s = otherInstance.listen(0, '127.0.0.1', () => resolve(s)); });
  const res = await fetch(`http://127.0.0.1:${srv.address().port}/api/auth-limited/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'x@example.com', password: 'y' }) });
  srv.close();
  assert.equal(res.status, 429);
});

test('health check and unknown API routes', { skip }, async () => {
  const health = await fetch(base + '/real/api/health').catch(() => null);
  // createApp() is mounted under /real, so its own routes are at /real/api/*.
  assert.ok(health);
  assert.equal(health!.status, 200);
  const body = await health!.json();
  assert.equal(body.database, 'connected');
  assert.ok(!JSON.stringify(body).includes('mongodb'), 'no connection details exposed');
  const missing = await fetch(base + '/real/api/nope');
  assert.equal(missing.status, 404);
});
