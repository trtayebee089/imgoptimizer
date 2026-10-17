# Optimizer.pro

Free image optimizer: compress large images and convert them to WebP (or JPEG/PNG) **in the browser**, with a marketing site, accounts, a dashboard with per-user optimization history, and account settings.

## How it works

| Layer | What it does |
| --- | --- |
| Frontend | React 19 + Vite 6, Tailwind CSS 3 (build time), a small History-API router (`lib/router.tsx`). |
| Optimization engine | `utils/imageOptimizer.ts` — Canvas API, runs entirely in the browser. **Images are never uploaded.** Smart mode iterates quality/dimensions toward a target size; Basic mode encodes once. |
| API | Express 5 (`server/app.ts`): `/api/auth/*`, `/api/history/*`, `/api/health`. |
| Database | MongoDB via Mongoose (`server/models.ts`): users, sessions, password resets, optimization history (sizes/formats only), rate-limit counters. |
| Hosting | Vercel: static `dist/` + one serverless function (`api/index.ts`) for `/api/*` (see `vercel.json`). `server.ts` is the long-running Node server for local dev or self-hosting. |

### Routes

| Path | Page |
| --- | --- |
| `/` | Landing page (Features, How It Works, Benefits, FAQ) |
| `/privacy`, `/terms` | Privacy Policy, Terms of Service |
| `/signup`, `/signin`, `/forgot-password`, `/reset-password` | Account pages (`/login` redirects to `/signin`) |
| `/app` | Overview — personal stats and recent activity |
| `/app/optimize` | Image Optimizer workspace |
| `/app/history` | Optimization History (paginated) |
| `/app/settings` | Profile, default optimizer settings, password, sessions, clear history, delete account |
| `/app/help` | Help & Support |

### Authentication

- Passwords hashed with **scrypt** (Node `crypto`, N=32768, per-user salt). Policy: 8–128 chars, common passwords and "password = email" rejected.
- Sessions: 32-byte random token in an **HttpOnly, SameSite=Lax** cookie (`__Host-op_session` + `Secure` in production; host-only). Only the SHA-256 of the token is stored. 1 day, or 30 days with "Keep me signed in". Tokens rotate on sign-in; logout deletes the session server-side; "Sign out on all devices" and password changes revoke other sessions.
- Password reset: single-use token (only its hash stored), 60-minute expiry, generic response (no account enumeration), all sessions revoked on reset. Links are built **only from `APP_URL`** in production.
- Rate limits (stored in MongoDB so they hold across serverless instances): sign-in 10 / 15 min per IP and per email, sign-up 10 / h per IP, reset 5 / h per IP and per email, history writes 600 / 10 min.
- Cross-site writes rejected (Origin check + JSON-only bodies). Private APIs return `401 {code:"unauthenticated"}`; the dashboard then shows a sign-in dialog instead of discarding work.

### Privacy

Images are processed on the user's device. History stores per file only: original bytes, output bytes, input/output format, mode, success/failure, timestamp — no image data, no file names. Users can clear history or delete their account (removes user, sessions, reset tokens and history).

## Run locally

Prerequisites: Node.js 20+.

```bash
npm install
npm run dev:memory     # temporary in-memory MongoDB (downloads a mongod binary on first run)
# or, with your own database:
npx tsx --env-file=.env.local server.ts
```

Open http://localhost:3000. Without an email provider, password-reset links are printed to the server log in development.

## Checks

```bash
npm run typecheck         # TypeScript
npm test                  # unit + engine regression tests (Mongo tests are skipped without a DB)
npm run test:integration  # API integration tests against a temporary in-memory MongoDB
npm run build             # client (dist/) + Node server bundle (dist/server.cjs)
```

## Environment variables

See [`.env.example`](.env.example). Summary:

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string (server only). Without it, account APIs answer `503 db_not_configured`. |
| `APP_URL` | Yes (prod) | Canonical URL, e.g. `https://imgoptz.hivelabsbd.com`. Reset links, canonical/OG tags, sitemap. Needed **at build time** for SEO tags. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Yes for password reset | Resend API key and a sender on a verified domain. Without them, production reports reset as unavailable — it never pretends an email was sent. |
| `SUPPORT_EMAIL` | No | Public support address (build time). Hidden when unset. |
| `COOKIE_SECURE`, `TRUST_PROXY`, `PORT`, `AUTH_LOG_RESET_LINKS` | No | See `.env.example`. |

Deployment and custom-domain steps: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
