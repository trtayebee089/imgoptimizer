import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, hashToken, generateToken } from '../server/password';
import { parseCookies, sessionCookieName } from '../server/auth';
import { resetDeliveryMode } from '../server/email';
import { validateEmail, validatePassword, validateName, normalizeEmail, passwordStrength } from '../lib/validation';

test('password hashing round-trips and rejects wrong passwords', async () => {
  const hash = await hashPassword('correct horse battery');
  assert.match(hash, /^scrypt\$\d+\$\d+\$\d+\$/);
  assert.ok(!hash.includes('correct horse battery'));
  assert.equal(await verifyPassword('correct horse battery', hash), true);
  assert.equal(await verifyPassword('wrong password', hash), false);
  assert.equal(await verifyPassword('anything', 'not-a-valid-hash'), false);
});

test('password hashes are salted', async () => {
  assert.notEqual(await hashPassword('same-password'), await hashPassword('same-password'));
});

test('tokens are random and stored only as hashes', () => {
  const a = generateToken();
  const b = generateToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 40);
  assert.equal(hashToken(a), hashToken(a));
  assert.notEqual(hashToken(a), a);
});

test('cookie parsing', () => {
  assert.deepEqual(parseCookies('a=1; op_session=abc%3D; b=2'), { a: '1', op_session: 'abc=', b: '2' });
  assert.deepEqual(parseCookies(undefined), {});
  assert.deepEqual(parseCookies('bad; x=%E0%A4%A'), {});
});

test('session cookie uses the __Host- prefix only when Secure', () => {
  const prev = { COOKIE_SECURE: process.env.COOKIE_SECURE, NODE_ENV: process.env.NODE_ENV };
  try {
    process.env.COOKIE_SECURE = 'true';
    assert.equal(sessionCookieName(), '__Host-op_session');
    process.env.COOKIE_SECURE = 'false';
    assert.equal(sessionCookieName(), 'op_session');
    delete process.env.COOKIE_SECURE;
    process.env.NODE_ENV = 'production';
    assert.equal(sessionCookieName(), '__Host-op_session');
  } finally {
    if (prev.COOKIE_SECURE === undefined) delete process.env.COOKIE_SECURE; else process.env.COOKIE_SECURE = prev.COOKIE_SECURE;
    if (prev.NODE_ENV === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prev.NODE_ENV;
  }
});

test('validation rules', () => {
  assert.equal(normalizeEmail('  Foo@Example.COM '), 'foo@example.com');
  assert.equal(validateEmail('foo@example.com'), null);
  assert.ok(validateEmail('foo@'));
  assert.ok(validateEmail(''));
  assert.equal(validatePassword('tangerine-77'), null);
  assert.ok(validatePassword('short'));
  assert.ok(validatePassword('x'.repeat(129)));
  assert.ok(validatePassword('password123'), 'common passwords are rejected');
  assert.ok(validatePassword('aaaaaaaaaa'), 'repeated characters are rejected');
  assert.ok(validatePassword('ada@example.com', 'ada@example.com'), 'email as password is rejected');
  assert.equal(validateName('Ada'), null);
  assert.ok(validateName('   '));
  assert.ok(validateName('x'.repeat(81)));
});

test('password strength meter', () => {
  assert.equal(passwordStrength('').score, 0);
  assert.equal(passwordStrength('short').score, 1);
  assert.equal(passwordStrength('tangerine').score, 2);
  assert.equal(passwordStrength('Tangerine-77').score, 3);
  assert.equal(passwordStrength('Tangerine-77-Orchard').score, 4);
});

test('reset delivery reflects configuration honestly', () => {
  const keys = ['RESEND_API_KEY', 'EMAIL_FROM', 'NODE_ENV', 'AUTH_LOG_RESET_LINKS'] as const;
  const prev = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  try {
    keys.forEach(k => delete process.env[k]);
    assert.equal(resetDeliveryMode(), 'server-log', 'development falls back to the server log');
    process.env.NODE_ENV = 'production';
    assert.equal(resetDeliveryMode(), 'unavailable', 'production without a provider is unavailable');
    process.env.RESEND_API_KEY = 're_test';
    assert.equal(resetDeliveryMode(), 'unavailable', 'API key alone is not enough');
    process.env.EMAIL_FROM = 'Optimizer <no-reply@example.com>';
    assert.equal(resetDeliveryMode(), 'email');
  } finally {
    keys.forEach(k => { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; });
  }
});
