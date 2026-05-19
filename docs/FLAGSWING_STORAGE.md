# Flagswing storage (Cloudflare R2)

## Current architecture

- **New admin flag uploads** go to **Cloudflare R2** via the Express route `POST /api/admin/flag-files/upload`, proxied from Vercel `POST /api/admin/flag-files/upload` (same-origin).
- Metadata is stored in Neon table **`country_flag_files`** with `file_key`, `file_url`, optional `preview_url`, and `storage_provider = 'r2'`.
- **Legacy** rows may still point at **Vercel Blob** (`storage_provider = 'vercel_blob'` or URLs containing `blob.vercel-storage.com`). Do not delete those objects automatically.

Apply migration:

`apps/backend/src/db/migrations/neon_003_country_flag_files_r2_columns.sql`

## Required backend (Railway / API server)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres |
| `CLERK_SECRET_KEY` | Verify Clerk Bearer token on admin R2 upload |
| `ADMIN_EMAIL` | Admin allow-list (comma-separated) |
| `CLOUDFLARE_R2_ACCOUNT_ID` | R2 account id |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 API token |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `CLOUDFLARE_R2_BUCKET_NAME` | Bucket name |
| `CLOUDFLARE_R2_PUBLIC_URL` | Public HTTPS base (no trailing slash) |
| `INTERNAL_AUTH_BRIDGE_SECRET` | Clerk JWT cookie bridge (unchanged) |
| `FRONTEND_URL` | CORS |
| `JWT_SECRET`, `PADDLE_*` | As before |

Optional aliases: `R2_*`, `CLOUDFLARE_ACCOUNT_ID`, `AWS_*` (see `storage/r2.ts` and `storage/storage-env.ts`).

## Required frontend (Vercel)

| Variable | Purpose |
|----------|---------|
| `API_URL` or `NEXT_PUBLIC_API_URL` | Backend base ending in `/api` — **required** to proxy admin upload to R2 |
| `CLERK_SECRET_KEY` | Clerk admin gate on Next |
| `ADMIN_EMAIL` | Allow-list |
| `DATABASE_URL` | Gallery + download metadata |
| `CLOUDFLARE_R2_*` | Same as backend — used by `/api/download` for **signed GET URLs** (premium) |

Public env (examples):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- `NEXT_PUBLIC_PADDLE_ENVIRONMENT`

Legacy Blob façade (optional): `BLOB_PUBLIC_BASE_URL` — only for old Blob URLs.

## Premium protection

- `/api/download/[fileId]` checks Clerk + plan + tier before redirecting.
- **R2** rows use **short-lived signed URLs** for paid/freemium (and admins) when `CLOUDFLARE_R2_*` credentials exist on the **Next.js server**.
- For **maximum** protection, store paid masters in a **private** R2 bucket and never publish direct URLs; keep only previews on a public bucket/CDN.

## Import existing R2 keys into Neon

1. Build backend: `cd apps/backend && npm run build`
2. Prepare `files.json` (array) — see header in `src/scripts/import-r2-existing-files.ts`
3. Run: `node dist/scripts/import-r2-existing-files.js files.json`
