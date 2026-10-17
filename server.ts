import express from 'express';
import path from 'path';
import { createApp } from './server/app.js';
import { connectDb } from './server/db.js';

// Long-running Node server: local development (Vite middleware) or self-hosted
// production (serves dist/). On Vercel, api/index.ts is used instead.

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Connect eagerly so configuration problems show up in the log at startup.
  connectDb().then(() => console.log('Connected to MongoDB'), () => { /* logged by connectDb */ });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use((_req, res, next) => { res.setHeader('Content-Security-Policy', CSP); next(); });
    app.use(express.static(distPath, { index: false }));
    // Express 5 requires a named wildcard; '*' crashes at startup.
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
