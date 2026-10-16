// Integration tests for /api/auth against a real MongoDB.
// Set MONGODB_URI_TEST (a throwaway database — it is dropped afterwards) to run them.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import type { AddressInfo } from 'net';
import { createAuthRouter, PasswordReset } from '../server/auth';
import { hashToken } from '../server/password';

const MONGO = process.env.MONGODB_URI_TEST;
const skip = !MONGO && 'MONGODB_URI_TEST not set';

let base = '';
let server: ReturnType<express.Express['listen']> | undefined;
let resetLinks: string[] = [];
const originalLog = console.log;

/** Tiny client with a cookie jar for one "browser". */
const client = (prefix = '/api/auth') => {
  let cookie = '';
  return async (path: string, init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) => {
    const res = await fetch(base + prefix + path, {
      method: init.method || 'GET',
      headers: { ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...init.headers },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) {
      const [pair] = set.split(';');
      cookie = pair.endsWith('=') ? '' : pair;
    }
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, setCookie: set, cookie: () => cookie };
  };
};

before(async () => {
  if (skip) return;
  await mongoose.connect(MONGO!);
  await mongoose.connection.dropDatabase();
  await mongoose.connection.syncIndexes();
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter({ limits: { login: 1000, signup: 1000, reset: 1000 } }));
  app.use('/api/auth-limited', createAuthRouter({ limits: { login: 3 } }));
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

  const res = await c('/signup', { method: 'POST', body: { name: 'Ada Lovelace', email: 'Ada@Example.com', password: 'analytical-engine' } });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, 'ada@example.com');
  assert.equal(res.body.user.plan, 'free');
  assert.equal(res.body.user.passwordHash, undefined);
  assert.match(res.setCookie!, /op_session=/);
  assert.match(res.setCookie!, /HttpOnly/i);
  assert.match(res.setCookie!, /SameSite=Lax/i);

  const me = await c('/me');
  assert.equal(me.body.user.name, 'Ada Lovelace');
});

test('signup validates input and rejects duplicate emails', { skip }, async () => {
  const c = client();
  const bad = await c('/signup', { method: 'POST', body: { name: '', email: 'nope', password: 'short' } });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.fields.name && bad.body.fields.email && bad.body.fields.password);

  const dup = await c('/signup', { method: 'POST', body: { name: 'Ada', email: 'ada@example.com', password: 'another-password' } });
  assert.equal(dup.status, 409);
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

test('logout invalidates the session server-side', { skip }, async () => {
  const c = client();
  const login = await c('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'analytical-engine' } });
  const stolen = login.cookie();
  assert.ok(stolen);
  const out = await c('/logout', { method: 'POST', body: {} });
  assert.equal(out.status, 204);
  assert.equal((await c('/me')).body.user, null);
  // Re-using the old cookie value no longer works.
  const replay = await fetch(base + '/api/auth/me', { headers: { Cookie: stolen } }).then(r => r.json());
  assert.equal(replay.user, null);
});

test('profile update and password change require a session', { skip }, async () => {
  const anon = client();
  assert.equal((await anon('/me', { method: 'PATCH', body: { name: 'X' } })).status, 401);
  assert.equal((await anon('/change-password', { method: 'POST', body: { currentPassword: 'a', newPassword: 'bbbbbbbb' } })).status, 401);

  const c = client();
  const other = client();
  await c('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'analytical-engine' } });
  await other('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'analytical-engine' } });

  const renamed = await c('/me', { method: 'PATCH', body: { name: 'Augusta Ada' } });
  assert.equal(renamed.body.user.name, 'Augusta Ada');

  const badCurrent = await c('/change-password', { method: 'POST', body: { currentPassword: 'nope', newPassword: 'new-password-1' } });
  assert.equal(badCurrent.status, 400);
  const changed = await c('/change-password', { method: 'POST', body: { currentPassword: 'analytical-engine', newPassword: 'new-password-1' } });
  assert.equal(changed.status, 204);
  assert.ok((await c('/me')).body.user, 'current session survives');
  assert.equal((await other('/me')).body.user, null, 'other sessions are revoked');
  assert.equal((await client()('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'new-password-1' } })).status, 200);
});

test('forgot/reset password flow uses single-use, hashed tokens', { skip }, async () => {
  const c = client();
  const unknown = await c('/forgot-password', { method: 'POST', body: { email: 'nobody@example.com' } });
  const known = await c('/forgot-password', { method: 'POST', body: { email: 'ada@example.com' } });
  assert.equal(unknown.status, 200);
  assert.deepEqual(unknown.body, known.body, 'response does not reveal whether the account exists');
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
});

test('cross-origin and non-JSON writes are rejected', { skip }, async () => {
  const c = client();
  const xo = await c('/login', { method: 'POST', body: { email: 'ada@example.com', password: 'reset-password-1' }, headers: { Origin: 'https://evil.example' } });
  assert.equal(xo.status, 403);
  const form = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'email=a&password=b' });
  assert.equal(form.status, 415);
});

test('login is rate limited', { skip }, async () => {
  const c = client('/api/auth-limited');
  let last = 0;
  for (let i = 0; i < 4; i++) {
    last = (await c('/login', { method: 'POST', body: { email: 'ratelimit@example.com', password: 'wrong-password' } })).status;
  }
  assert.equal(last, 429);
});
