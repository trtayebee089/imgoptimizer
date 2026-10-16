# Optimizer.pro

Free image optimizer that runs in the browser: WebP/JPEG/PNG output, target file size, quality floor, minimum dimensions, batch processing. Images are processed client-side with the Canvas API and are never uploaded.

## Structure

| Path | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/signup`, `/login`, `/forgot-password`, `/reset-password` | Account pages |
| `/app`, `/app/statistics`, `/app/guide`, `/app/updates`, `/app/account` | Signed-in workspace |
| `server.ts` | Express server (Vite middleware in dev, `dist/` in production) |
| `server/auth.ts` | `/api/auth/*` — signup, login, logout, profile, password change/reset |
| `utils/imageOptimizer.ts` | Optimization engine (unchanged) |

## Run locally

**Prerequisites:** Node.js 20+ and a MongoDB database.

1. `npm install`
2. Set `MONGODB_URI` in your environment (see `.env.example` for all variables). The server does not read `.env` files itself; export the variable or run e.g. `npx tsx --env-file=.env.local server.ts`.
3. `npm run dev` → http://localhost:3000

Production: `npm run build && NODE_ENV=production npm start`.

## Checks

- `npm run typecheck`
- `npm test` — route-guard and auth unit tests. API integration tests also run when `MONGODB_URI_TEST` points at a throwaway database (it is dropped afterwards).

## Accounts

- Passwords are hashed with scrypt; sessions are random tokens stored hashed in MongoDB and sent as an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production).
- No email provider is configured: password-reset links are written to the server log outside production. Configure email delivery before relying on password reset in production.
