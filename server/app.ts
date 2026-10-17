import express from 'express';
import { createAuthRouter } from './auth.js';
import { createHistoryRouter } from './history.js';
import { apiErrorHandler } from './errors.js';
import { connectDb, dbState, isDbConfigured } from './db.js';
import { isEmailConfigured } from './email.js';

// The API as an Express app. Used by server.ts (local/Node hosting) and by
// api/index.ts (Vercel serverless function). Static files are served elsewhere.

export const securityHeaders: express.RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  // Behind Vercel (or another proxy that overwrites X-Forwarded-For) trust one hop so req.ip is the client.
  const trust = process.env.TRUST_PROXY ?? (process.env.VERCEL ? '1' : '');
  if (trust) app.set('trust proxy', /^\d+$/.test(trust) ? Number(trust) : trust === 'true' ? true : trust);
  app.use(securityHeaders);

  // Readiness check. Reports configuration state only — no hosts, users or credentials.
  app.get('/api/health', async (_req, res) => {
    if (isDbConfigured()) { try { await connectDb(); } catch { /* reported below */ } }
    const database = dbState();
    res.setHeader('Cache-Control', 'no-store');
    res.status(database === 'connected' ? 200 : 503).json({
      status: database === 'connected' ? 'ok' : 'degraded',
      database,
      email: isEmailConfigured() ? 'configured' : 'not_configured',
    });
  });

  app.use('/api/auth', createAuthRouter());
  app.use('/api/history', createHistoryRouter());

  // Unknown API routes should not fall through to the SPA.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(apiErrorHandler);
  return app;
};
