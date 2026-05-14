# Backend (Node.js, Express, PostgreSQL)

REST API for the flag stock marketplace. Production-ready setup with JWT auth,
role-based access, asset CRUD, an admin CMS, and a Lemon Squeezy billing
integration (checkouts, subscriptions, one-time orders, webhooks).

## Stack

- Node.js 20+ (uses `fetch`)
- Express 5
- TypeScript (ESM, NodeNext)
- PostgreSQL (Neon-compatible)
- Bull + Redis for the upload processing queue
- Lemon Squeezy as Merchant of Record for payments

## Development

```bash
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, and (when ready) LEMONSQUEEZY_* values.

npm install
npm run dev
```

The server starts on `http://localhost:4000`. The first DB connection runs
pending migrations from `src/db/schema.sql` and `src/db/migrations/*.sql`.

## API surface

```
GET    /                                 Service banner
GET    /health                           Liveness + DB ping

# Auth (JWT, 15 min access + 30 day refresh)
POST   /api/auth/register                Create account + send verification email
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/auth/me                       Update profile (full_name)

# Email + password lifecycle
GET    /api/auth/verify-email?token=...   Confirm email (link target)
POST   /api/auth/verify-email             Confirm email (JSON {token})
POST   /api/auth/resend-verification      Resend verify email (authenticated)
POST   /api/auth/forgot-password          Always 200; sends reset email if user exists
POST   /api/auth/reset-password           {token, password}
POST   /api/auth/change-password          {currentPassword, newPassword} (authenticated)

# Multi-factor authentication (TOTP + backup codes)
GET    /api/auth/mfa/status                       Current MFA state
POST   /api/auth/mfa/setup                        Start enrollment (QR + backup codes)
POST   /api/auth/mfa/enroll                       Confirm with first code {code}
POST   /api/auth/mfa/verify                       PUBLIC — exchange {challengeToken, code} for session
POST   /api/auth/mfa/disable                      Disable {password}
POST   /api/auth/mfa/backup-codes/regenerate      Rotate codes {password}

# Catalog
GET    /api/assets                       Search/filter (public)
GET    /api/assets/:id
GET    /api/assets/slug/:slug
GET    /api/assets/:id/download          Returns signed/watermarked URL
POST   /api/assets                       admin only
PUT    /api/assets/:id                   admin only
DELETE /api/assets/:id                   admin only

# Subscriptions (read-only views)
GET    /api/subscriptions/plans
GET    /api/subscriptions/my-subscription
GET    /api/subscriptions/check-premium

# Billing (provider-aware: Paddle [active] + Lemon Squeezy [legacy])
POST   /api/billing/checkout              Create hosted checkout URL
POST   /api/billing/subscriptions/cancel  Cancel at period end
POST   /api/billing/subscriptions/resume  Un-cancel / resume
POST   /api/billing/subscriptions/pause   Pause subscription
POST   /api/billing/portal                Customer portal / payment-method URL
GET    /api/billing/orders                List one-time purchases
GET    /api/billing/subscription          Current sub (provider-aware)
POST   /api/billing/webhook/paddle        Public webhook (Paddle, HMAC verified)
POST   /api/billing/webhook/lemonsqueezy  Public webhook (Lemon Squeezy, legacy)

# Admin (auth + admin role)
GET    /api/admin/stats
POST   /api/admin/assets/upload           Bulk asset upload
GET    /api/admin/assets
GET    /api/admin/assets/:id
PUT    /api/admin/assets/:id
PATCH  /api/admin/assets/:id/toggle
DELETE /api/admin/assets/:id
GET    /api/admin/assets/:id/stats
GET    /api/admin/categories
GET    /api/admin/tags
# Countries module
GET/POST/PUT/DELETE  /api/admin/countries  (+ /flags subroutes)

# Upload pipeline (admin)
POST   /api/admin/upload/initiate                      Start chunked session
PUT    /api/admin/upload/:upload_id/chunk/:n           Upload chunk (multipart or raw octet-stream)
POST   /api/admin/upload/:upload_id/complete           Finalize, kicks off processing
GET    /api/admin/upload/:upload_id/status             Poll progress
DELETE /api/admin/upload/:upload_id                    Cancel + cleanup
POST   /api/admin/upload/direct                        Small-file one-shot multipart upload
POST   /api/admin/upload/admin/cleanup                 Sweep expired sessions
POST   /api/admin/upload/flag                          Legacy base64 → Vercel Blob
```

## Email + password flows

Transactional emails are dispatched by `src/mailer/`. By default the
`console` provider just logs to stdout, which is the safe dev default.

Switch to a real provider by setting env vars:

```bash
MAIL_PROVIDER=resend
RESEND_API_KEY=re_...
MAIL_FROM_ADDRESS=no-reply@yourdomain.com
MAIL_FROM_NAME=Flag Stock
PUBLIC_FRONTEND_URL=https://yourdomain.com
```

### Email verification

1. `POST /api/auth/register` — backend creates the user and fires
   `email-verification` email containing a link of the form
   `${PUBLIC_FRONTEND_URL}/verify-email?token=...`.
2. The frontend route reads `?token` and posts it back to
   `POST /api/auth/verify-email`. On success, `users.email_verified` flips to
   true and the token row is consumed.
3. To resend, a logged-in user calls `POST /api/auth/resend-verification`
   (60-second cooldown by default).

### Password reset

1. `POST /api/auth/forgot-password { email }` — always returns 200 (no
   account-existence leak). If the user exists, an email is sent with a link of
   the form `${PUBLIC_FRONTEND_URL}/reset-password?token=...`.
2. The frontend collects the new password and calls
   `POST /api/auth/reset-password { token, password }`.
3. On success, the password is updated, **all refresh tokens for the user are
   revoked** (existing sessions must re-auth), and a "password changed" notice
   email is sent.

Tokens are stored as `sha256(hex)` — even with full DB access an attacker
cannot reuse them. Default lifetimes:

| Token | TTL | Env override |
|---|---|---|
| Email verification | 24 h | `EMAIL_VERIFICATION_TOKEN_TTL_HOURS` |
| Password reset | 30 min | `PASSWORD_RESET_TOKEN_TTL_MINUTES` |

Every send is logged to `email_outbox` (status, provider message id, attempts).

## Multi-factor authentication (TOTP)

### Enrollment

```ts
// 1. Start setup
const setup = await fetch('/api/auth/mfa/setup', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
}).then(r => r.json());
// setup = { secret, otpauth_url, qr_code_data_url, backup_codes[], expires_at }

// 2. Show the QR code (img src = setup.qr_code_data_url) and backup codes.
//    User scans with Google Authenticator / Authy / 1Password etc.

// 3. User types the 6-digit code generated by the app; confirm enrollment.
await fetch('/api/auth/mfa/enroll', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ code: '123456' }),
});
```

Backup codes are returned **only once** in plain text — render them on screen
and ask the user to download/save before continuing. The DB stores only
sha256 hashes.

### Login with MFA

```ts
// Phase 1 — normal login
const r1 = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
}).then(r => r.json());

if (r1.mfa_required) {
  // Phase 2 — user enters TOTP or backup code
  const tokens = await fetch('/api/auth/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken: r1.challenge_token,
      code: userInput,
    }),
  }).then(r => r.json());
  // tokens = { accessToken, refreshToken, user }
} else {
  // No MFA — `r1` already contains the session tokens
}
```

The challenge token is one-time use, expires in 5 minutes (configurable via
`MFA_CHALLENGE_TTL_SECONDS`), and locks out after 5 wrong attempts.

### Disable / rotate backup codes

```ts
await fetch('/api/auth/mfa/disable', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ password }), // current password required
});

await fetch('/api/auth/mfa/backup-codes/regenerate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ password }),
});
```

### Storage & crypto

- TOTP secret: AES-256-GCM, key derived via scrypt from `ENCRYPTION_KEY`
  (falls back to `JWT_SECRET` if unset). Format: `iv:tag:ciphertext` (hex).
- Backup codes: stored as `sha256(NORMALIZED_CODE)`. Comparison normalizes
  whitespace + dashes + casing before hashing.
- Pending enrollments live in `mfa_pending_enrollments` and expire after 15
  minutes if not confirmed.

## Chunked upload — client flow

```ts
// 1. Tell server we want to upload a large file
const init = await fetch('/api/admin/upload/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    metadata: { description: '...' },
  }),
}).then(r => r.json());
const { upload_id, chunk_size, total_chunks } = init;

// 2. Upload each chunk (you can parallelize)
for (let n = 0; n < total_chunks; n++) {
  const slice = file.slice(n * chunk_size, (n + 1) * chunk_size);
  await fetch(`/api/admin/upload/${upload_id}/chunk/${n}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream', Authorization: `Bearer ${token}` },
    body: slice,
  });
}

// 3. Tell server we are done — backend reassembles, validates, hashes,
//    creates a Bull job, and returns the processing job id.
const result = await fetch(`/api/admin/upload/${upload_id}/complete`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ checksum: 'sha256:...' }), // optional
}).then(r => r.json());

// 4. Poll status
await fetch(`/api/admin/upload/${upload_id}/status`, {
  headers: { Authorization: `Bearer ${token}` },
}).then(r => r.json());
```

Chunks may also be uploaded as multipart with field name `chunk`. The default
chunk size is 10 MB; configurable via `CHUNK_SIZE` env.

## Billing setup

The backend supports both **Paddle Billing** (active default — works from
Uzbekistan and most countries via Wise/bank transfer payouts) and
**Lemon Squeezy** (legacy — does not support UZ payouts). The database schema
is provider-neutral, so you can switch at any time by setting
`BILLING_PROVIDER` env (`paddle` or `lemonsqueezy`).

Both providers are **Merchants of Record** — they handle global sales tax,
VAT, GST, refunds, and chargebacks on your behalf. You receive consolidated
payouts and a single 1099/invoice.

### Paddle Billing (recommended)

1. **Create an account**
   - Sandbox: https://sandbox-vendors.paddle.com — for development.
   - Live: https://www.paddle.com — submit business verification (1–7 days).
2. **Create products + prices**
   - Catalog → Products → Add product (e.g. "Pro Plan").
   - Add a **price** under it. Copy the `pri_…` id.
3. **Get API credentials**
   - Developer Tools → API authentication → "New API key".
4. **Register the webhook**
   - Developer Tools → Notifications → New endpoint.
   - URL: `https://api.YOUR_DOMAIN.com/api/billing/webhook/paddle`
   - Events: select at minimum `transaction.completed`,
     `transaction.payment_failed`, `subscription.*`, `adjustment.created`.
   - Copy the signing secret (`pdl_ntfset_…` or `ntfset_…` for sandbox).
5. **Configure env**
   ```bash
   BILLING_PROVIDER=paddle
   PADDLE_API_KEY=pdl_sdbx_apikey_...
   PADDLE_WEBHOOK_SECRET=ntfset_...
   PADDLE_PRICE_MAP_JSON={"subscriptionByPlanSlug":{"weekly-premium":"pri_..."}}
   PADDLE_CHECKOUT_SUCCESS_URL=https://yourdomain.com/dashboard/purchases
   ```
6. **Local dev with ngrok**
   ```bash
   ngrok http 4000
   # Register https://abc.ngrok.app/api/billing/webhook/paddle in Paddle dashboard
   ```

#### How the Paddle flow works

1. Frontend calls `POST /api/billing/checkout` with `{ kind: 'subscription', planSlug: 'pro-monthly' }`.
2. Backend resolves the local slug to a Paddle `pri_…` (env or DB), creates a
   transaction via `POST /transactions` with `custom_data.user_id = <uuid>`,
   and returns `{ url, transaction_id }`.
3. Frontend redirects to `url` (Paddle-hosted checkout) **or** opens Paddle.js
   inline with that transaction id.
4. After payment, Paddle posts `transaction.completed` /
   `subscription.created` to our webhook. We verify the
   `Paddle-Signature: ts=…;h1=…` HMAC, deduplicate via `webhook_deliveries`,
   and upsert `user_subscriptions` / `orders`.

#### Webhook signature verification (Paddle)

Header format: `Paddle-Signature: ts=<unix>;h1=<hex_hmac_sha256>`.
The HMAC is computed over `${ts}:${rawBody}` with the endpoint secret.
We additionally enforce a 5-minute freshness window against replay attacks.
See [`paddle-signature.ts`](src/billing/paddle/paddle-signature.ts).

### Lemon Squeezy setup (legacy)

The backend ships ready for [Lemon Squeezy](https://lemonsqueezy.com) as the
billing provider. Lemon Squeezy acts as the Merchant of Record, so it handles
global sales tax, VAT, and refunds — you receive consolidated payouts.

### 1. Create the store and products

1. Sign up at https://app.lemonsqueezy.com and create a store.
2. Add **one product per subscription plan** (e.g. *Weekly Premium*, *Monthly Premium*).
   Each plan needs at least one **Variant** — the LS Variant id is what the backend talks to.
3. Optionally add products for one-time purchases (single-asset packs, etc.).

### 2. Configure environment

Set these in `apps/backend/.env`:

```bash
LEMONSQUEEZY_API_KEY=lsk_live_...
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_SIGNING_SECRET=whsec_...
LEMONSQUEEZY_CHECKOUT_SUCCESS_URL=https://yourdomain.com/dashboard/purchases
LEMONSQUEEZY_TEST_MODE=true   # while testing

# Map your slugs → LS variant ids
LEMONSQUEEZY_VARIANT_MAP_JSON={"subscriptionByPlanSlug":{"weekly-premium":"100001","monthly-premium":"100002"},"oneTimeByProductSlug":{"united-states-standard":"100003"}}
```

Alternatively, leave `LEMONSQUEEZY_VARIANT_MAP_JSON` unset and write the
variant ids directly to the database:

```sql
UPDATE subscription_plans
   SET provider_variant_id = '100001'
 WHERE slug = 'weekly-premium';
```

### 3. Register the webhook

In Lemon Squeezy dashboard:

- **Settings → Webhooks → Add endpoint**
- URL: `https://api.YOUR_DOMAIN.com/api/billing/webhook/lemonsqueezy`
- Events: at minimum check `order_created`, `order_refunded`, and all
  `subscription_*` events.
- Copy the **signing secret** → `LEMONSQUEEZY_SIGNING_SECRET`.

For local dev, expose the backend over a tunnel:

```bash
ngrok http 4000
# → https://abcd1234.ngrok.app/api/billing/webhook/lemonsqueezy
```

### 4. How the flow works

1. **User clicks "Subscribe"** on the frontend.
2. Frontend calls `POST /api/billing/checkout` with `{ kind: 'subscription', planSlug }`
   and the user's JWT cookie/Bearer.
3. Backend resolves the LS variant id, calls LS API, returns a hosted checkout URL.
   The custom field `user_id` is attached so webhooks can attribute the purchase.
4. User pays on LS-hosted page; LS posts `subscription_created` (and friends) to
   our webhook.
5. Webhook handler verifies the HMAC, deduplicates via `webhook_deliveries`,
   upserts a row in `user_subscriptions` with provider-neutral columns.
6. Frontend polls `/api/subscriptions/my-subscription` (or `/check-premium`)
   to know whether the user has access.

### 5. Cancel / resume / portal

- `POST /api/billing/subscriptions/cancel` — soft-cancel (active until period end).
- `POST /api/billing/subscriptions/resume` — undo a soft-cancel.
- `POST /api/billing/subscriptions/pause` — pause (LS supports void/free modes).
- `POST /api/billing/portal` — returns a hosted customer portal URL.

## Database schema

- `users`, `refresh_tokens` — auth.
- `subscription_plans` — pricing tiers. `provider_variant_id` ties them to LS.
- `user_subscriptions` — billing state. Provider-neutral columns
  (`billing_provider`, `provider_subscription_id`, …) live alongside legacy
  `stripe_*` columns for backward compatibility.
- `orders` — one-time purchases. Unique on `(billing_provider, provider_order_id)`.
- `webhook_deliveries` — per-provider HMAC delivery log; unique idempotency key
  prevents double-processing.
- `assets`, `asset_files`, `asset_tags`, `tags`, `asset_categories`, `downloads`,
  `countries`, `country_flag_files`, `asset_processing_queue` — catalog and CMS.

Schema migrations live in `src/db/`:

- `schema.sql` — baseline (applied once on first boot).
- `migrations/*.sql` — additive, lexicographic order, each tracked in
  `schema_migrations.name`.

## Build & deploy

```bash
npm run build   # → dist/
npm start
```

The migration runner resolves SQL files from `src/db/` even when running from
`dist/` (it walks up two levels), so you do not need a `cpx` step.

## Production checklist

- [ ] Strong `JWT_SECRET` (≥ 64 random bytes).
- [ ] `DATABASE_URL` points at a managed Postgres (Neon, RDS, etc.).
- [ ] Redis configured if uploads are used.
- [ ] All `LEMONSQUEEZY_*` vars set; `LEMONSQUEEZY_TEST_MODE=false`.
- [ ] LS webhook registered in dashboard pointing at HTTPS host.
- [ ] CDN provider configured if asset distribution is enabled.
- [ ] `subscription_plans.provider_variant_id` populated for each plan slug.
