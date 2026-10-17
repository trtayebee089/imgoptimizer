# Deployment checklist

Target: Vercel project currently at `https://imgoptz.vercel.app`, moving to `https://imgoptz.hivelabsbd.com`.

## Why the old deployment's accounts didn't work

Before this change Vercel deployed only the static Vite build: every `/api/*` request returned Vercel's `NOT_FOUND`, so sign-up and sign-in could not work in production. `api/index.ts` + `vercel.json` now deploy the Express API as a serverless function and rewrite `/api/*` to it.

## 1. MongoDB

1. Create a database (for example MongoDB Atlas). Use a dedicated database user with **readWrite on this one database only** (least privilege; no `atlasAdmin`).
2. Network access: Vercel functions don't have fixed IPs on most plans. Either allow `0.0.0.0/0` with a strong password, or use Vercel Secure Compute / Atlas private endpoints if available on your plan.
3. Indexes are created automatically by Mongoose on first connection (unique `users.email`, unique `sessions.tokenHash`, TTL indexes on sessions/resets/rate limits, history indexes). No migration is needed. Nothing is written to the database during `npm run build`.
4. Existing data: the old global `stats` collection is no longer read or written. It can be left in place or dropped manually.

## 2. Email (password reset)

1. Create a [Resend](https://resend.com) account and verify the sending domain (`hivelabsbd.com` or a subdomain) using the DNS records Resend shows you.
2. Create an API key with "Sending access".
3. Set `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `Optimizer.pro <no-reply@hivelabsbd.com>`).

Until this is done, "Forgot password" in production shows: *"Password reset by email isn't set up on this deployment yet, so no email was sent."*

## 3. Vercel environment variables

Project → Settings → Environment Variables, for **Production** (and Preview if used):

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | your connection string |
| `APP_URL` | `https://imgoptz.hivelabsbd.com` (no trailing slash) |
| `RESEND_API_KEY` | from Resend |
| `EMAIL_FROM` | verified sender |
| `SUPPORT_EMAIL` | optional public support address |

`NODE_ENV=production` is set by Vercel. `APP_URL` and `SUPPORT_EMAIL` are read at **build time** too (canonical tags, sitemap, support links), so redeploy after changing them.

Build settings come from `vercel.json` (`npm run build:client`, output `dist/`, framework Vite).

## 4. Custom subdomain

1. Vercel → Project → Settings → Domains → add `imgoptz.hivelabsbd.com`.
2. Vercel shows the DNS record to create (normally a `CNAME` for `imgoptz`). Add **exactly the value Vercel shows** at the DNS host for `hivelabsbd.com`. Don't copy values from elsewhere.
3. Wait for verification; Vercel issues the HTTPS certificate automatically.
4. Optionally redirect `imgoptz.vercel.app` to the custom domain (Domains → Edit → Redirect).
5. Set `APP_URL=https://imgoptz.hivelabsbd.com` and redeploy.

Cookies are **host-only** (`__Host-op_session`), so they are scoped to `imgoptz.hivelabsbd.com` and are not shared with other `hivelabsbd.com` subdomains. Signing in on `imgoptz.vercel.app` and on the custom domain are separate sessions; that's expected.

No OAuth callbacks or CORS origins need configuring: the frontend and API share one origin.

## 5. Verify after deploy

```bash
curl -s https://imgoptz.hivelabsbd.com/api/health
# expect {"status":"ok","database":"connected","email":"configured"}
```

Then in a browser on the custom domain:

- [ ] Sign up → lands on Overview; the response sets `__Host-op_session` with `Secure; HttpOnly; SameSite=Lax`
- [ ] Sign out → `/signin`; visiting `/app` redirects to `/signin?next=%2Fapp`
- [ ] Sign in again (wrong password shows a generic error)
- [ ] Forgot password → email arrives → link opens `/reset-password` on the custom domain → new password works; using the link twice fails
- [ ] Optimize an image → Overview and History show it
- [ ] `https://imgoptz.hivelabsbd.com/robots.txt` and `/sitemap.xml` use the custom domain

## Self-hosting instead of Vercel

`npm run build && NODE_ENV=production npm start` serves `dist/` and the API from one Node process (`dist/server.cjs`), with the same security headers and CSP. Behind a reverse proxy, set `TRUST_PROXY=1` so rate limits see the client IP.
