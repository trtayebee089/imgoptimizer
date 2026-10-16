import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute, safeNext, normalizePath } from '../lib/routes';

test('public pages render for everyone', () => {
  for (const status of ['loading', 'anonymous', 'authenticated'] as const) {
    assert.deepEqual(resolveRoute('/', '', status), { kind: 'render', route: 'landing' });
    assert.deepEqual(resolveRoute('/forgot-password', '', status), { kind: 'render', route: 'forgot-password' });
    assert.deepEqual(resolveRoute('/reset-password', '?token=x', status), { kind: 'render', route: 'reset-password' });
  }
});

test('app routes require authentication', () => {
  assert.deepEqual(resolveRoute('/app', '', 'anonymous'), { kind: 'redirect', to: '/login?next=%2Fapp' });
  assert.deepEqual(resolveRoute('/app/statistics', '', 'anonymous'), { kind: 'redirect', to: '/login?next=%2Fapp%2Fstatistics' });
  assert.deepEqual(resolveRoute('/app', '', 'loading'), { kind: 'wait' });
});

test('app routes map to workspace tabs when signed in', () => {
  assert.deepEqual(resolveRoute('/app', '', 'authenticated'), { kind: 'render', route: 'app', tab: 'workspace' });
  assert.deepEqual(resolveRoute('/app/', '', 'authenticated'), { kind: 'render', route: 'app', tab: 'workspace' });
  assert.deepEqual(resolveRoute('/app/guide', '', 'authenticated'), { kind: 'render', route: 'app', tab: 'guide' });
  assert.deepEqual(resolveRoute('/app/account', '', 'authenticated'), { kind: 'render', route: 'app', tab: 'account' });
  assert.deepEqual(resolveRoute('/app/nope', '', 'authenticated'), { kind: 'render', route: 'not-found' });
});

test('signed-in users are sent from login/signup to the app (honouring safe ?next)', () => {
  assert.deepEqual(resolveRoute('/login', '', 'authenticated'), { kind: 'redirect', to: '/app' });
  assert.deepEqual(resolveRoute('/signup', '', 'authenticated'), { kind: 'redirect', to: '/app' });
  assert.deepEqual(resolveRoute('/login', '?next=%2Fapp%2Fguide', 'authenticated'), { kind: 'redirect', to: '/app/guide' });
  assert.deepEqual(resolveRoute('/login', '?next=https%3A%2F%2Fevil.example', 'authenticated'), { kind: 'redirect', to: '/app' });
  assert.deepEqual(resolveRoute('/login', '', 'anonymous'), { kind: 'render', route: 'login' });
});

test('safeNext rejects open redirects', () => {
  assert.equal(safeNext('/app/guide'), '/app/guide');
  assert.equal(safeNext('//evil.example'), '/app');
  assert.equal(safeNext('/\\evil.example'), '/app');
  assert.equal(safeNext('https://evil.example'), '/app');
  assert.equal(safeNext(null), '/app');
});

test('unknown paths render not-found', () => {
  assert.deepEqual(resolveRoute('/pricing', '', 'anonymous'), { kind: 'render', route: 'not-found' });
  assert.equal(normalizePath('/login/'), '/login');
  assert.equal(normalizePath('/'), '/');
});
