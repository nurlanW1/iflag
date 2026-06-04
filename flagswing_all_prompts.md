# FLAGSWING — CLAUDE CODE PROMPT LARI
## 22 ta prompt, bosqichma-bosqich

> Har prompt boshida qo'sh:
> "D:\flagim\iflag loyihasida ishlayman. Avval tegishli fayllarni o'qi."

---

# BOSQICH 1 — MUHIT

## P-01 — ENV SOZLASH

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/.env.example faylini o'qi.

1. apps/frontend/.env.local yaratib to'ldir:
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=https://flagswing.com
NEXT_PUBLIC_CONTACT_EMAIL=support@flagswing.com
DATABASE_URL=PLACEHOLDER_NEON_URL
ADMIN_EMAIL=PLACEHOLDER_ADMIN_EMAIL
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=PLACEHOLDER

2. apps/backend/.env yaratib to'ldir:
PORT=4000
DATABASE_URL=PLACEHOLDER_NEON_URL
CLERK_SECRET_KEY=PLACEHOLDER
PADDLE_API_KEY=PLACEHOLDER
PADDLE_WEBHOOK_SECRET=PLACEHOLDER
CLOUDFLARE_R2_ACCOUNT_ID=PLACEHOLDER
CLOUDFLARE_R2_ACCESS_KEY_ID=PLACEHOLDER
CLOUDFLARE_R2_SECRET_ACCESS_KEY=PLACEHOLDER
CLOUDFLARE_R2_BUCKET_NAME=PLACEHOLDER
CLOUDFLARE_R2_PUBLIC_URL=PLACEHOLDER
JWT_SECRET=GENERATE_64_CHAR_RANDOM
INTERNAL_AUTH_BRIDGE_SECRET=GENERATE_32_CHAR_RANDOM
ADMIN_EMAIL=PLACEHOLDER

3. Har ikki .env .gitignore da borligini tekshir.
4. apps/frontend/src/lib/env.ts yarat — type-safe env exports.
```

---

## P-02 — LOKAL ISHGA TUSHIRISH

```
D:\flagim\iflag loyihasida ishlayman.
apps/backend/src/index.ts va apps/frontend/next.config.mjs o'qi.

Tekshir va tuzat:
1. Backend CORS: localhost:3000 ga ruxsat
2. GET /api/health endpoint yarat: { status: "ok", timestamp: Date.now() }
3. Frontend: /api/* so'rovlari localhost:4000/api ga proxy
4. Clerk middleware.ts: public routes /, /flags/*, /pricing, /sign-in, /sign-up

Root package.json ga qo'sh:
"dev": "concurrently \"npm run dev --workspace=frontend\" \"npm run dev --workspace=backend\""
concurrently yo'q bo'lsa: npm install -D concurrently

Oxirida qaysi papkada qanday buyruq ishlatish kerakligini ayt.
```

---

## P-03 — PLACEHOLDER TOZALASH

```
D:\flagim\iflag/apps/frontend/src papkasini to'liq qidir.

Quyidagilarni topib almashtir:
- "PLACEHOLDER" matni
- "yourdomain.com" -> "flagswing.com"
- "hello@yourdomain.com" -> "support@flagswing.com"
- "[Legal name of the entity]" -> "Flagswing"
- "[PLACEHOLDER: contact]" -> "support@flagswing.com"

Qoida:
- Env orqali bo'lsa: process.env.NEXT_PUBLIC_CONTACT_EMAIL
- Statik bo'lsa: to'g'ridan almashtir

Topilgan har fayl va qator nomini ayt, keyin tuzat.
Oxirida nechta joy o'zgardi — xulosa qil.
```

---

# BOSQICH 2 — SAHIFALAR

## P-04 — FLAG CATALOG SAHIFASI

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/ papkasini o'qi — catalog qayerda ekanini tushun.

Catalog sahifasini (/ yoki /flags) yangilab ber:

1. GRID:
- Responsive: mobile 2, tablet 4, desktop 6 ustun
- FlagCard: preview rasm (next/image lazy), davlat nomi, format badge'lar (SVG/PNG/EPS), Free/Premium badge
- Hover: shakllar mini preview (circle, heart, star) opacity transition bilan

2. FILTERBAR (sticky):
- Kategoriya: All / Independent / US States / Autonomous / Historical
- Format: All / SVG / PNG / Video
- Type: All / Free / Premium
- Qidiruv: real-time client-side
- Aktiv filter count badge

3. LOADING: 12 ta skeleton card
4. EMPTY STATE: "No flags found for '[query]'" + "Notify me" tugmasi

Tailwind CSS, TypeScript, mavjud DB query bilan uyg'un.
```

---

## P-05 — FLAG DETAIL SAHIFASI

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/flags/[slug]/ sahifasini toping.
DATABASE_SCHEMA.md o'qi.

Flag detail sahifasini yangilab ber:

1. HERO:
- Katta flag preview (600px, next/image, priority=true)
- Dark/Light background toggle (localStorage da saqlansin)
- "Official Colors": har rang — rangli doira + HEX + RGB + CMYK + "Copy" tugmasi
- Format download: [SVG 12KB ↓] [PNG 45KB ↓] [EPS ↓] [PDF ↓]

2. SHAPES (premium):
- Grid 3x2: Circle / Heart / Star / Sphere / Map / Diamond
- Har karta: preview + "$3" + "Buy" tugmasi
- "Buy All Shapes — $9 (save 50%)" CTA

3. SEO generateMetadata:
- title: "[Country] Flag SVG PNG Free Download | Flagswing"
- description: "Download [Country] flag in SVG, PNG, EPS. Free flat + premium shapes."
- og:image: R2 preview URL
- JSON-LD ImageObject schema

4. Related flags: 6 ta bir xil kategoriyadan

Mavjud jadval nomlarini DB schema dan o'qi.
```

---

## P-06 — COUNTRY TO'LIQ SAHIFASI

```
D:\flagim\iflag loyihasida ishlayman.

/country/[slug] yangi sahifasi yarat:

1. TEPA: Flag (katta) + Gerb — yonma-yon
2. MA'LUMOTLAR: davlat nomi (EN + mahalliy), poytaxt, bayroq qabul yili
3. OFFICIAL COLORS:
- Har rang: rangli karta + ism + HEX + RGB + CMYK + Pantone
- Har qiymat yonida Copy tugmasi (sonner toast)
4. BAYROQ TARIXI: 150-200 so'z (DB yoki statik)
5. ASSETLAR TABS: Flat / Shapes / Mockups / Video / Historical
6. MILLIY BAYRAM: "Independence Day: [sana]"

Statik generation (generateStaticParams).
SEO: "[Country] Flag — Colors, History, SVG | Flagswing"

apps/frontend/content/countries/[slug].json statik data fayllar yarat.
20 ta asosiy davlatdan boshlang: USA, UK, France, Germany, Russia,
China, Japan, Turkey, Uzbekistan, Kazakhstan, India, Brazil,
Canada, Australia, Italy, Spain, Ukraine, UAE, Saudi Arabia, South Korea.
```

---

## P-07 — TARIXIY BAYROQLAR SAHIFASI

```
D:\flagim\iflag loyihasida ishlayman.

/flags/historical sahifasini yarat:

1. HEADER: "Historical & Former Country Flags"
2. GRID — quyidagi 12 ta uchun karta:
- Soviet Union (SSSR) 1922-1991
- Ottoman Empire 1299-1922
- Timurid Empire 1370-1507
- Byzantine Empire 395-1453
- Mughal Empire 1526-1857
- Imperial Japan 1868-1947
- Yugoslavia 1918-1992
- Czechoslovakia 1918-1993
- Confederate States 1861-1865
- Holy Roman Empire 962-1806
- Mongol Empire 1206-1368
- Roman Empire 27BC-476AD

3. Har karta: preview + nomi + yillar + 1 jumla tavsif + "View & Download"
4. SEO: "Historical Country Flags SVG — Soviet Union, Ottoman, Byzantine | Flagswing"
5. Statik sahifa.

apps/frontend/content/historical-flags.json ma'lumotlar faylini yarat.
```

---

## P-08 — GERBLAR SAHIFASI

```
D:\flagim\iflag loyihasida ishlayman.

/emblems sahifasini yarat:

1. HEADER: "National Coats of Arms"
   Info banner: "All emblems sourced from public domain. Free for personal use."

2. GRID: gerb preview + davlat nomi + "Free PD" badge + Download
   Filter: Region (Europe / Asia / Americas / Africa / Oceania)

3. /emblems/[slug] detail sahifasi:
- Katta preview
- Litsenziya: "Public Domain" yoki "CC-BY — attribution required"
- Manba: "Source: Wikimedia Commons" + havola
- Download: SVG + PNG

4. Har sahifada ogohlantirish:
"Commercial use restrictions may apply in some countries."

5. SEO: "[Country] Coat of Arms SVG Free Download | Flagswing"

apps/frontend/content/emblems/[slug].json fayllar yarat.
```

---

# BOSQICH 3 — TO'LOV TIZIMI

## P-09 — BACKEND PADDLE WEBHOOK

```
D:\flagim\iflag loyihasida ishlayman.
apps/backend/src/ papkasini o'qi — mavjud billing kodni toping.
DATABASE_SCHEMA.md o'qi — jadval nomlarini tushun.

Paddle backend ni to'liq ishga tayyor qil:

POST /api/billing/checkout:
- Clerk auth tekshir (req.auth.userId)
- Body: { priceId, type: "single"|"bundle"|"subscription" }
- Paddle API checkout session yarat
- Javob: { checkoutUrl: string }

POST /api/billing/webhook/paddle:
- Paddle-Signature verify (PADDLE_WEBHOOK_SECRET)
- subscription.activated: user_subscriptions ga INSERT
- subscription.updated: status va period_end UPDATE
- subscription.cancelled: status = "cancelled"
- transaction.completed (one-time):
  * orders ga INSERT (clerk_user_id, asset_id, amount, paddle_transaction_id)
  * download_tokens ga INSERT (token, asset_id, clerk_user_id, expires_at=now+24h)

GET /api/billing/subscription:
- userId bo'yicha aktiv subscription qaytarsin
- { isActive, plan, expiresAt }

GET /api/billing/orders:
- userId bo'yicha barcha one-time purchase'lar

Jadvallar yo'q bo'lsa — migration SQL yarat.
```

---

## P-10 — FRONTEND PADDLE CHECKOUT

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/ da mavjud billing kodni toping.

1. apps/frontend/src/lib/paddle.ts:
- initPaddle(): Paddle.js lazy load
- openCheckout({ priceId, userId, email, type }):
  Backend /api/billing/checkout ga fetch
  Qaytgan checkoutUrl ni ochadi
  Fallback: window.location.href = checkoutUrl

2. src/components/billing/BuyButton.tsx:
Props: { priceId, label, variant: "single"|"bundle"|"subscription", assetId? }
- Login yo'q: /sign-in?redirect_url=[current] ga
- Login bor: openCheckout()
- States: idle / loading / error
- Error: sonner toast

3. src/app/pricing/page.tsx:
FREE karta: SVG+PNG, 250+ davlat, no attribution, "Browse Free Flags"
SINGLE $3: barcha formatlar, commercial license, BuyButton
BUNDLE $12: bir davlat barcha shakllar, save 50%, BuyButton
ANNUAL $99 Coming Soon: email input + "Notify Me"

4. src/app/thank-you/page.tsx:
- session_id param
- Oxirgi order dan download havolalar
- "Go to downloads" tugmasi

NEXT_PUBLIC_PADDLE_CLIENT_TOKEN env kerak.
```

---

## P-11 — XAVFSIZ FAYL YUKLAB OLISH

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/api/download/ papkasini o'qi.

1. src/lib/r2-download.ts:
- getPresignedDownloadUrl(key, expiresInSeconds): Promise<string>
- @aws-sdk/s3-request-presigner ishlat (installed)

2. src/app/api/download/[fileId]/route.ts GET:

BEPUL FAYL:
- R2 presigned URL (1 soat TTL) redirect

PREMIUM FAYL — tekshiruvlar:
a) MARKETPLACE_OWNER_DOWNLOAD_EMAILS da email bormi?
b) user_subscriptions da aktiv obuna bormi?
c) orders da bu fileId sotib olinganmi?
- True bo'lsa: presigned URL (15 daqiqa TTL) redirect
- False: 403 { error: "premium_required", upgradeUrl: "/pricing" }

3. src/components/DownloadButton.tsx:
Props: { fileId, fileName, isFree, format, sizeKb? }
- Format + hajm: "SVG — 12KB ↓"
- 200: window.location.href = url
- 403: PremiumModal ochilsin
- Loading: spinner

4. PremiumModal:
- Narx ko'rsat, "Buy for $3" → BuyButton, "View pricing" → /pricing
```

---

# BOSQICH 4 — FOYDALANUVCHI TAJRIBASI

## P-12 — RANG KODLARI TIZIMI

```
D:\flagim\iflag loyihasida ishlayman.

1. apps/frontend/content/flag-colors.json yarat:
20 ta davlat uchun rang data:
{
  "slug": "usa",
  "colors": [
    { "name": "Old Glory Red", "hex": "#B22234", "rgb": "178,34,52",
      "cmyk": "0,81,71,30", "pantone": "193 C" }
  ]
}
Davlatlar: USA, UK, France, Germany, Russia, China, Japan, Turkey,
Uzbekistan, Kazakhstan, Ukraine, Italy, Spain, Brazil, India,
Saudi Arabia, UAE, Australia, Canada, South Korea

2. src/components/flags/ColorPalette.tsx:
Props: { colors: FlagColor[] }
Har rang uchun:
- Rangli karta (background: hex)
- Ism + HEX + "Copy" | RGB + "Copy" | CMYK + "Copy" | Pantone + "Copy"
- Copy: navigator.clipboard.writeText() + sonner toast "Copied: #B22234"
- Tugma: Copy icon → Check icon (1 soniya)

3. Flag detail sahifasiga ColorPalette qo'sh (slug bo'yicha ma'lumot ol)
4. SEO keywords: "USA flag colors hex, American flag blue hex code"
```

---

## P-13 — FAVORITES TIZIMI

```
D:\flagim\iflag loyihasida ishlayman.

1. src/hooks/useFavorites.ts:
- Login yo'q: localStorage (maks 10)
- Login bor: backend /api/favorites ga sync
- toggleFavorite(flagId), isFavorite(flagId): boolean, favorites: string[]

2. src/app/api/favorites/route.ts:
GET: userId bo'yicha favorites
POST { flagId }: qo'shish
DELETE { flagId }: olib tashlash

Migration:
CREATE TABLE user_favorites (
  id SERIAL PRIMARY KEY,
  clerk_user_id VARCHAR NOT NULL,
  flag_file_id INTEGER REFERENCES flag_files(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(clerk_user_id, flag_file_id)
);

3. FlagCard va detail sahifaga:
- Yurak tugmasi (top-right corner, overlay)
- Outline -> to'liq yurak animatsiya
- Login yo'q: "Sign in to save" tooltip

4. /account/favorites sahifasi:
- "My Saved Flags" + grid
- Har kartada "Remove" tugmasi
- Bo'sh: "No saved flags yet. Browse flags →"
```

---

## P-14 — TOPILMADI EMAIL TIZIMI

```
D:\flagim\iflag loyihasida ishlayman.

1. src/components/search/NotFoundState.tsx:
Props: { query: string }
- "No results for '[query]'"
- "We don't have this flag yet. Want us to add it?"
- Email input + "Notify Me" tugmasi
- Submit: /api/flag-requests POST

2. src/app/api/flag-requests/route.ts:
POST { query, email }
Migration:
CREATE TABLE flag_requests (
  id SERIAL PRIMARY KEY,
  query VARCHAR NOT NULL,
  email VARCHAR,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(query)
);
- Mavjud query: count++ (UPSERT)
- 200: { message: "We'll notify you!" }

3. /admin/requests sahifasi:
- flag_requests count bo'yicha jadval
- "Add flag" → /admin/upload

4. Catalog'da: 0 natija + 300ms delay => NotFoundState ko'rsin
```

---

## P-15 — BACKGROUND TOGGLE VA PREVIEW

```
D:\flagim\iflag loyihasida ishlayman.

1. src/components/ui/BackgroundToggle.tsx:
- [Sun Light] [Moon Dark] tugmalar
- localStorage da saqlash
- Container fon CSS transition 0.2s

2. Catalog FlagCard hover preview:
- Desktop: hover da 400x267px popover (katta preview)
- BackgroundToggle shu yerda ham
- Escape / tashqari click — yopiladi
- Mobile: tap toggle

3. Flag detail sahifasida:
- Preview min-height 300px, centered
- BackgroundToggle — top-right
- Smooth transition

4. Preview ostida size info:
- Vector: "Original: Scalable Vector (SVG)"
- PNG: "Original: 2400x1600px"
```

---

## P-16 — TRENDING BADGE VA EMBED KOD

```
D:\flagim\iflag loyihasida ishlayman.

TRENDING BADGE:
1. GET /api/analytics/top-flags?limit=20&period=week (backend):
- download_logs dan oxirgi 7 kun top flag ID lar
- Redis cache 1 soat

2. src/app/api/top-flags/route.ts: revalidate: 3600

3. FlagCard badge (top-left overlay):
- "Trending" — top 20 da
- "New" — 14 kun ichida yaratilgan
- Bitta badge, New ustunlik

4. Catalog tepasida "Most Downloaded This Week" row (8 flag, horizontal scroll)

---

EMBED KOD:
5. Flag detail "For Developers" bo'limi (EmbedCode.tsx):
Tabs: HTML / CSS / React / Markdown
HTML: <img src="https://cdn.flagswing.com/flags/svg/[slug].svg" alt="[Country]" width="60" height="40">
CSS: .flag-[slug] { background-image: url('...'); width:60px; height:40px; }
React: <img src="https://cdn.flagswing.com/flags/svg/[slug].svg" alt="[Country]" />
Markdown: ![[Country]](https://cdn.flagswing.com/flags/svg/[slug].svg)
Har tab: syntax highlight (pre/code) + "Copy Code" tugmasi
```

---

# BOSQICH 5 — SEO VA TEXNIK

## P-17 — SITEMAP VA ROBOTS

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/ da mavjud sitemap bormi tekshir.

1. src/app/sitemap.ts (MetadataRoute.Sitemap):
DB dan: SELECT slug, updated_at FROM flag_files WHERE status='published'
URL lar:
- / — priority 1.0, daily
- /flags — 0.9, daily
- /flags/[slug] — 0.8, weekly (har flag)
- /flags/historical — 0.8
- /flags/us-states — 0.7
- /emblems — 0.7
- /country/[slug] — 0.7
- /pricing — 0.6

2. src/app/robots.ts:
Disallow: /api/, /admin/, /sign-in, /sign-up, /account/
Sitemap: https://flagswing.com/sitemap.xml

3. src/app/layout.tsx global metadata:
title.default: "Flagswing — World Flag Assets SVG PNG Download"
title.template: "%s | Flagswing"
description: "Download country flags SVG, PNG, EPS. Free flat + premium shapes, historical, 250+ countries."
metadataBase: new URL('https://flagswing.com')
openGraph: { type: "website", siteName: "Flagswing" }
```

---

## P-18 — PERFORMANCE OPTIMALLASHTIRISH

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/next.config.mjs o'qi.

1. next.config.mjs:
- images.remotePatterns: R2 public URL
- images.formats: ['image/avif', 'image/webp']
- compress: true, poweredByHeader: false

2. Catalog: birinchi 12 SSR, qolgan client-side load
3. next/image: catalog width=200 height=133, detail priority=true (LCP)
4. Font: next/font/google (agar yo'q bo'lsa)
5. framer-motion: lazy import faqat kerakli joyda
6. lucide-react: named import faqat (import { Heart } — not import *)

Maqsad: LCP < 2.5s, CLS < 0.1
```

---

## P-19 — WAITLIST VA EMAIL

```
D:\flagim\iflag loyihasida ishlayman.

1. src/app/api/waitlist/route.ts:
POST { email, type: "annual"|"contributor"|"newsletter"|"new_flag" }
Migration:
CREATE TABLE waitlist (
  id SERIAL PRIMARY KEY, email VARCHAR NOT NULL,
  type VARCHAR NOT NULL, created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email, type)
);
- Resend bilan confirmation email: "You're on the list — Flagswing"
- Duplicate: silent 200

2. Pricing Annual karta: email + "Notify Me" (type="annual")
3. Footer: "Get notified" newsletter (type="newsletter")
4. /contribute sahifasi: contributor interest form (type="contributor")

RESEND_API_KEY env variable qo'sh.
```

---

# BOSQICH 6 — ADMIN PANEL

## P-20 — ADMIN PANEL TO'LIQ

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/admin/ o'qi.
ADMIN_PANEL.md va ADMIN_UI_DESIGN.md o'qi.

1. /admin dashboard:
- Kartalar: jami assets, bugungi downloads, foydalanuvchilar, oylik daromad
- Recent downloads jadval (sana, flag, foydalanuvchi, format)
- Pending flags bo'limi

2. /admin/flags:
- Jadval: thumb | nomi | kategoriya | format | narx | status | harakatlar
- Status toggle bir klik Draft/Published
- Bulk: tanlash + publish/delete
- Qidiruv + filter

3. /admin/upload:
- Drag & drop multi-file
- Har fayl metadata: davlat (autocomplete), slug (auto), kategoriya,
  format (checkbox), tip, shape turi, Free/Premium, narx ($3 default)
- Progress bar
- R2 + Neon DB ga saqlash

4. /admin/orders: Paddle tranzaksiyalar jadval
5. /admin/requests: flag_requests count bo'yicha + "Add flag" tugmasi

Clerk ADMIN_EMAIL tekshiruv: faqat admin ko'rsin.
```

---

## P-21 — TARIXIY XARITA (VIRAL KONTENT)

```
D:\flagim\iflag loyihasida ishlayman.

/world-history sahifasida interaktiv tarixiy bayroq xaritasi:

1. SVG world map (react-simple-maps yoki D3 — install qilsa bo'ladi)
2. Yil slider: 1800 — 2024
3. Slider o'zgarsa: davlatlar ranglanadi (o'sha davlat bayrog'i rangi bilan)
4. Davlatga bosish: o'sha davlat o'sha yildagi bayrog'i + ma'lumot

Boshlash uchun faqat shu bilan chekla:
Yillar: 1900, 1920, 1945, 1991, 2024
Davlatlar: Russia/USSR, Turkey/Ottoman, Germany, France, UK,
USA, China, Japan, India, Italy

content/world-history.json — data fayl
src/app/world-history/page.tsx — sahifa
src/components/WorldHistoryMap.tsx — komponent

SEO: "World Flag History Map — Interactive | Flagswing"
Bu sahifa social media da viral bo'lishi mumkin.
```

---

## P-22 — FOYDALANUVCHI HISOB SAHIFASI

```
D:\flagim\iflag loyihasida ishlayman.

/account sahifasi (Clerk login kerak, middleware bilan himoyalangan):

1. /account/downloads:
- Sotib olingan barcha assetlar (orders jadvalidan)
- Har qator: flag preview, nomi, sana, "Download" tugmasi
- Download: /api/download/[fileId] ga

2. /account/favorites:
- Saqlangan bayroqlar (P-13 dan)
- "Remove" tugmasi

3. /account/subscription:
- Hozirgi plan: Free / Single purchases / Annual
- Paddle subscription status (P-09 /api/billing/subscription dan)
- "Upgrade" → /pricing
- "Manage billing" → Paddle customer portal

4. /account/settings:
- Email (Clerk dan, o'zgartirib bo'lmaydi — Clerk portal havolasi)
- Notification preferences (email toggle)
- "Delete account" — Clerk account delete

Nav: tabs yoki sidebar (Downloads | Favorites | Subscription | Settings)
Clerk useUser() hook bilan foydalanuvchi ma'lumotlari.
```

---

# ISHLATISH TARTIBI

## 1-KUN: Poydevor
P-01 env sozlash
P-02 lokal ishga tushirish
P-03 placeholder tozalash
P-17 sitemap va SEO meta

## 2-KUN: Sahifalar
P-04 catalog yaxshilash
P-05 flag detail
P-12 rang kodlari
P-15 background toggle

## 3-KUN: To'lov
P-09 backend Paddle webhook
P-10 frontend checkout
P-11 secure download

## 4-KUN: UX
P-13 favorites
P-14 topilmadi email
P-19 waitlist
P-16 trending + embed

## 5-KUN: Kontent
P-06 country sahifa
P-07 tarixiy bayroqlar
P-08 gerblar
P-22 account sahifasi

## 6-KUN: Yakunlash
P-18 performance
P-20 admin panel
P-21 tarixiy xarita (viral)

---

# CLAUDE CODE ISHLATISH QOIDALARI

## Har prompt boshiga qo'sh:
```
Men D:\flagim\iflag loyihasida ishlayman.
Stack: Next.js 16 + Express + TypeScript + Clerk + Neon PostgreSQL + R2 + Paddle
Avval tegishli fayllarni o'qi. Yangi paket o'rnatma — mavjudlarni ishlat.
```

## Xato bo'lganda:
```
Bu xatoni ko'r: [XATO MATNI]
apps/frontend/src/ yoki apps/backend/src/ da sababini topib tuzat.
TypeScript type xatosi bo'lsa — any ishllatma, to'g'ri type yoz.
```

## Ishlagan koddan keyin:
```
Yozgan [FUNKSIYA NOMI] uchun:
1. Edge case: noto'g'ri input, DB ulanmasa, R2 ishlamasa
2. Error handling yaxshila
3. Console.log larni olib tashla
4. Test uchun curl buyrug'i ber
```
