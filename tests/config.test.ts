// Behaviour when MongoDB is not configured: clear 503s, never a fake success.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'net';
import { createApp } from '../server/app';

let base = '';
let server: any;
const prevUri = process.env.MONGODB_URI;
const prevErr = console.error;

before(async () => {
  delete process.env.MONGODB_URI;
  console.error = () => {}; // the expected "[config] MONGODB_URI is not set" diagnostic
  server = await new Promise(resolve => { const s = createApp().listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server?.close();
  console.error = prevErr;
  if (prevUri !== undefined) process.env.MONGODB_URI = prevUri;
});

test('missing MONGODB_URI: auth and history answer 503 with a clear code', async () => {
  const signup = await fetch(base + '/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'A', email: 'a@example.com', password: 'analytical-engine', acceptTerms: true }) });
  assert.equal(signup.status, 503);
  const body = await signup.json();
  assert.equal(body.code, 'db_not_configured');
  assert.equal(signup.headers.get('set-cookie'), null, 'no session is issued');

  const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a@example.com', password: 'x' }) });
  assert.equal(login.status, 503);
  assert.equal((await fetch(base + '/api/auth/me')).status, 503);
  assert.equal((await fetch(base + '/api/history/summary')).status, 503);
});

test('missing MONGODB_URI: health reports not_configured without leaking details', async () => {
  const res = await fetch(base + '/api/health');
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { status: 'degraded', database: 'not_configured', email: 'not_configured' });
  assert.equal(res.headers.get('x-powered-by'), null);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});
