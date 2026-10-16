import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, hashToken, generateToken } from '../server/password';
import { parseCookies } from '../server/auth';
import { validateEmail, validatePassword, validateName, normalizeEmail } from '../lib/validation';

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

test('validation rules', () => {
  assert.equal(normalizeEmail('  Foo@Example.COM '), 'foo@example.com');
  assert.equal(validateEmail('foo@example.com'), null);
  assert.ok(validateEmail('foo@'));
  assert.ok(validateEmail(''));
  assert.equal(validatePassword('12345678'), null);
  assert.ok(validatePassword('short'));
  assert.ok(validatePassword('x'.repeat(129)));
  assert.equal(validateName('Ada'), null);
  assert.ok(validateName('   '));
  assert.ok(validateName('x'.repeat(81)));
});
