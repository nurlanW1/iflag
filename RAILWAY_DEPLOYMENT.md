# Railway deployment — Flagswing backend only

The **Next.js frontend stays on Vercel**. Deploy the **Express + TypeScript API** from this monorepo’s `apps/backend` service.

---

## Exact Railway settings

| Setting | Value |
|--------|--------|
| **Root Directory** | `apps/backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |

Config-as-code (optional): `apps/backend/railway.json` sets the same build/start commands, **`/health`** as the deployment health check path, and restart policy. Dashboard values are overridden when this file is used—see [Railway Config as Code](https://docs.railway.com/deploy/config-as-code).

Railway injects **`PORT`**. The server listens on **`0.0.0.0`** by default (`LISTEN_HOST` optional).

---

## Scripts (`apps/backend/package.json`)

| Script | Purpose |
|--------|--------|
| `npm run dev` | Local development (`ts-node-dev` + ESM loader) |
| `npm run build` | Builds workspace deps (`packages/storage`, `packages/watermarking`), runs `tsc`, copies SQL into `dist/` |
| `npm run start` | Production: **`node dist/index.js`** |

---

## Health check

```http
GET /health
```

**200** (database reachable):

```json
{
  "status": "healthy",
  "database": "connected"
}
```

**503** (Neon / `DATABASE_URL` down or misconfigured):

```json
{
  "status": "unhealthy",
  "database": "disconnected"
}
```

---

## Monorepo note

`apps/backend` depends on **`file:../../packages/storage`** and **`file:../../packages/watermarking`**. Railway clones the **full GitHub repo**, so those paths exist when the service **Root Directory** is `apps/backend`. The `build` script compiles those packages before emitting `dist/`.

---

## Required environment variables (Railway)

Set **`NODE_ENV=production`**.

### Core

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon PostgreSQL URL (`sslmode=require` is normalized in `src/db.ts`) |
| `CLERK_SECRET_KEY` | Same secret as Clerk Dashboard / Vercel — required for **`Authorization: Bearer`** admin routes (e.g. flag upload) |
| `ADMIN_EMAIL` | Comma-separated allow-list for Clerk admin verification (see `src/auth/clerk-admin.server.ts`) |
| `FRONTEND_URL` | `https://flagswing.com` (and/or preview origins — merged with built-in CORS list) |
| `INTERNAL_AUTH_BRIDGE_SECRET` | Must match **Vercel** — Clerk → backend JWT bridge |
| `JWT_SECRET` | Long random secret (email/password auth and internal tokens) |

### Billing

| Variable | Notes |
|----------|--------|
| `PADDLE_API_KEY` | Paddle Billing API key |
| `PADDLE_WEBHOOK_SECRET` | Signing secret for **`POST /api/billing/webhook/paddle`** |

Webhook URL in Paddle must be:

`https://<your-railway-service>.up.railway.app/api/billing/webhook/paddle`

### Uploads / storage (Cloudflare R2)

New uploads use **R2** (S3-compatible). Configure:

| Variable | Notes |
|----------|--------|
| `CLOUDFLARE_R2_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 API token access key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `CLOUDFLARE_R2_BUCKET_NAME` | Bucket name |
| `CLOUDFLARE_R2_PUBLIC_URL` | Public asset base URL (no trailing slash) |

Aliases and marketplace pipeline vars are documented in `apps/backend/.env.example` (`STORAGE_TYPE=s3`, `R2_*`, etc.).

> **Note:** The backend codebase does **not** use `BLOB_READ_WRITE_TOKEN` or `@vercel/blob` for new uploads. Legacy DB rows may still point at old Blob URLs; do not delete tokens on Vercel until the frontend/gallery no longer needs them for those assets.

---

## CORS

Built-in allowed origins include **`https://flagswing.com`**, **`https://www.flagswing.com`**, **`http://localhost:3000`**, plus anything in **`FRONTEND_URL`** / **`ADDITIONAL_CORS_ORIGINS`**.

For Vercel previews, either list the preview URL explicitly or set **`CORS_ALLOW_VERCEL_PREVIEWS=true`** to allow `*.vercel.app`.

---

## Vercel (frontend) variables

Point the app at the Railway API (**must include `/api` suffix**):

| Variable | Example |
|----------|---------|
| `API_URL` | `https://your-service.up.railway.app/api` |
| `NEXT_PUBLIC_API_URL` | Same value when the browser must call the API directly |

Match **`INTERNAL_AUTH_BRIDGE_SECRET`** on Vercel and Railway.

Clerk runs on Next.js as usual; there is **no Vercel middleware on the Express server**—only standard Express routes + CORS.

---

## Clerk on Railway

- **`CLERK_SECRET_KEY`** — verify Clerk session JWTs on protected Express routes.
- **`ADMIN_EMAIL`** — gate admin uploads and related bearer flows.

---

## Production logging

`src/index.ts` logs:

- Successful listen address / `NODE_ENV`
- Warning if `DATABASE_URL` is missing
- **`[startup] Failed to bind HTTP server`** + exit on listen errors
- **`unhandledRejection`** / **`uncaughtException`** hooks

Use **Railway Logs** for runtime diagnostics.

---

## Local smoke test

```bash
cd apps/backend
npm install
npm run build
NODE_ENV=production PORT=4000 DATABASE_URL="postgresql://..." JWT_SECRET="..." npm run start
```

```bash
curl -sS http://127.0.0.1:4000/health
```

Expect `{"status":"healthy","database":"connected"}` when Neon is reachable.

---

## Final deployment checklist

1. **Git** — Commit and push backend + `railway.json` / docs changes.
2. **Railway** — New project → **Deploy from GitHub repo**.
3. **Service** — Set **Root Directory** to **`apps/backend`** (or set custom config path to `/apps/backend/railway.json` if needed).
4. **Build** — `npm install && npm run build`  
5. **Start** — `npm run start`
6. **Variables** — Paste all required env vars (Neon, Clerk, Paddle, R2, JWT, bridge secret, `FRONTEND_URL`).
7. **Deploy** — Wait for green health check on **`/health`**.
8. **Verify** — `curl https://<railway-host>/health`
9. **Vercel** — Set `API_URL` / `NEXT_PUBLIC_API_URL` to `https://<railway-host>/api`
10. **Paddle** — Update webhook URL to Railway host.
11. **Admin** — Upload a test file; confirm R2 object + `country_flag_files` row.
12. **Subscriptions / downloads** — Smoke-test checkout and protected download flows.

---

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| Build fails on `packages/storage` | Root Directory must be `apps/backend` so `../../packages/*` exists |
| **502** / connection refused | Wrong API URL on Vercel; service crashed — check Railway logs |
| CORS in browser | Add preview URL or `CORS_ALLOW_VERCEL_PREVIEWS=true` |
| Clerk admin **503** | Set **`CLERK_SECRET_KEY`** and **`ADMIN_EMAIL`** on Railway |
| Upload **503** | Configure **`CLOUDFLARE_R2_*`** (or `STORAGE_TYPE=s3` + `R2_*`) |
| Health **503** | **`DATABASE_URL`** wrong or Neon paused |
