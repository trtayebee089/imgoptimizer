import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute, safeNext, normalizePath, NOINDEX_ROUTES } from '../lib/routes';

test('public pages render for everyone', () => {
  for (const status of ['loading', 'anonymous', 'authenticated'] as const) {
    assert.deepEqual(resolveRoute('/', '', status), { kind: 'render', route: 'landing' });
    assert.deepEqual(resolveRoute('/privacy', '', status), { kind: 'render', route: 'privacy' });
    assert.deepEqual(resolveRoute('/terms', '', status), { kind: 'render', route: 'terms' });
    assert.deepEqual(resolveRoute('/forgot-password', '', status), { kind: 'render', route: 'forgot-password' });
    assert.deepEqual(resolveRoute('/reset-password', '?token=x', status), { kind: 'render', route: 'reset-password' });
  }
});

test('app routes require authentication', () => {
  assert.deepEqual(resolveRoute('/app', '', 'anonymous'), { kind: 'redirect', to: '/signin?next=%2Fapp' });
  assert.deepEqual(resolveRoute('/app/optimize', '', 'anonymous'), { kind: 'redirect', to: '/signin?next=%2Fapp%2Foptimize' });
  assert.deepEqual(resolveRoute('/app/settings', '', 'anonymous'), { kind: 'redirect', to: '/signin?next=%2Fapp%2Fsettings' });
  assert.deepEqual(resolveRoute('/app', '', 'loading'), { kind: 'wait' });
});

test('app routes map to dashboard tabs when signed in', () => {
  assert.deepEqual(resolveRoute('/app', '', 'authenticated'), { kind: 'render', route: 'app', tab: 'overview' });
  assert.deepEqual(resolveRoute('/app/', '', 'authenticated'), { kind: 'render', route: 'app', tab: 'overview' });
  assert.deepEqual(resolveRoute('/app/optimize', '', 'authenticated'), { kind: 'render', route: 'app', tab: 'optimizer' });
  assert.deepEqual(resolveRoute('/app/history', '', 'authenticated'), { kind: 'render', route: 'app', tab: 'history' });
  assert.deepEqual(resolveRoute('/app/settings', '', 'authenticated'), { kind: 'render', route: 'app', tab: 'settings' });
  assert.deepEqual(resolveRoute('/app/help', '', 'authenticated'), { kind: 'render', route: 'app', tab: 'help' });
  assert.deepEqual(resolveRoute('/app/nope', '', 'authenticated'), { kind: 'render', route: 'not-found' });
});

test('legacy paths redirect to their new locations', () => {
  assert.deepEqual(resolveRoute('/login', '?next=%2Fapp', 'anonymous'), { kind: 'redirect', to: '/signin?next=%2Fapp' });
  assert.deepEqual(resolveRoute('/app/statistics', '', 'authenticated'), { kind: 'redirect', to: '/app/history' });
  assert.deepEqual(resolveRoute('/app/guide', '', 'authenticated'), { kind: 'redirect', to: '/app/help' });
  assert.deepEqual(resolveRoute('/app/account', '', 'authenticated'), { kind: 'redirect', to: '/app/settings' });
  assert.deepEqual(resolveRoute('/app/updates', '', 'authenticated'), { kind: 'redirect', to: '/app' });
});

test('signed-in users are sent from signin/signup to the app (honouring safe ?next)', () => {
  assert.deepEqual(resolveRoute('/signin', '', 'authenticated'), { kind: 'redirect', to: '/app' });
  assert.deepEqual(resolveRoute('/signup', '', 'authenticated'), { kind: 'redirect', to: '/app' });
  assert.deepEqual(resolveRoute('/signin', '?next=%2Fapp%2Fhelp', 'authenticated'), { kind: 'redirect', to: '/app/help' });
  assert.deepEqual(resolveRoute('/signin', '?next=https%3A%2F%2Fevil.example', 'authenticated'), { kind: 'redirect', to: '/app' });
  assert.deepEqual(resolveRoute('/signin', '', 'anonymous'), { kind: 'render', route: 'signin' });
});

test('safeNext rejects open redirects', () => {
  assert.equal(safeNext('/app/help'), '/app/help');
  assert.equal(safeNext('//evil.example'), '/app');
  assert.equal(safeNext('/\\evil.example'), '/app');
  assert.equal(safeNext('https://evil.example'), '/app');
  assert.equal(safeNext(null), '/app');
});

test('private and auth pages are marked noindex; marketing pages are not', () => {
  for (const r of ['signin', 'signup', 'forgot-password', 'reset-password', 'app'] as const) assert.ok(NOINDEX_ROUTES.includes(r), r);
  for (const r of ['landing', 'privacy', 'terms'] as const) assert.ok(!NOINDEX_ROUTES.includes(r), r);
});

test('unknown paths render not-found', () => {
  assert.deepEqual(resolveRoute('/pricing', '', 'anonymous'), { kind: 'render', route: 'not-found' });
  assert.equal(normalizePath('/signin/'), '/signin');
  assert.equal(normalizePath('/'), '/');
});
