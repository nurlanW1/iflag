# FLAGSWING — UI/UX VA KONTENT YAXSHILASH PROMPT'LARI
## P-41 dan P-47 gacha — 7 ta yangi prompt

> Har prompt boshiga qo'sh:
> "D:\flagim\iflag loyihasida ishlayman. Avval tegishli fayllarni o'qi."

---

## P-41 — ASSET DETAIL SAHIFASI: NAVIGATSIYA VA RELATED DIZAYNLAR

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/ papkasini o'qi.
Asset detail sahifasini (gallery/[country]/[asset] yoki flags/[slug]) toping va o'qi.

VAZIFA 1 — ORTGA QAYTISH NAVIGATSIYASI:

Sahifa tepasida breadcrumb va back navigatsiya qo'sh:

← Gallery  /  United States  /  USA Sphere Flag

Komponent: src/components/ui/Breadcrumb.tsx
- "← Gallery" → /gallery yoki /flags ga qaytadi
- "United States" → /gallery/united-states ga qaytadi  
- Joriy asset nomi (bold)
- Mobile da faqat "← Back" ko'rinsin

Tailwind: flex items-center gap-2 text-sm text-gray-500
Active item: text-gray-900 font-medium
Separator: "/" text-gray-300

---

VAZIFA 2 — PASTDA: BIR XIL DAVLATNING BOSHQA VARIANTLARI

Asset detail sahifasining eng pastida "More from United States" bo'limi:

1. DB dan bir xil davlatga tegishli barcha boshqa assetlarni ol:
   SELECT * FROM flag_files 
   WHERE country_slug = [joriy_davlat] 
   AND id != [joriy_asset_id]
   AND status = 'published'
   ORDER BY created_at DESC

2. Ko'rinish — HORIZONTAL SCROLL qator:
   - Sarlavha: "More United States Flags"
   - Subtitle: "Other styles and variants"
   - Kartalar: kichik (120x90px preview), 1 qatorda, horizontal scroll
   - Har karta: preview + qisqa nom + narx badge (Free / $3)
   - Aktiv (joriy) karta: highlighted border
   - Hover: scale(1.05) transform

3. Tailwind CSS:
   div.flex.gap-3.overflow-x-auto.pb-3.scrollbar-hide
   Har karta: flex-shrink-0 w-28 cursor-pointer rounded-lg border hover:border-accent

4. Karta bosilganda: o'sha asset sahifasiga navigate (smooth)

5. Mobile da ham ishlaydi — swipe bilan scroll

6. Agar boshqa variant yo'q bo'lsa: bo'lim ko'rinmasin

src/components/flags/RelatedVariants.tsx sifatida yarat.
```

---

## P-42 — COUNTRY FOLDER SAHIFASI: UX YAXSHILASH

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/gallery/[country]/ yoki shunga o'xshash sahifani toping va o'qi.

Screenshot da ko'ringan "United States" country folder sahifasini yaxshila:

VAZIFA 1 — BAYROQ RASMI O'LCHAMI (o'ng tomonda):
Hozir juda katta. Quyidagicha o'zgartir:
- max-width: 180px
- max-height: 120px  
- border-radius: 6px
- box-shadow: 0 2px 12px rgba(0,0,0,0.10)
- object-fit: contain
- Desktop: heading bilan bir qatorda, o'ngda, top-aligned
- Mobile: heading ostida, left-aligned, max-width: 120px

VAZIFA 2 — DESCRIPTION STRUKTURASI:
Hozirgi generik 1-2 jumla o'rniga quyidagi strukturada ko'rsat:

[ 🌎 North America ]  [ 🏛 Federal Republic ]  [ ✦ Sovereign State ]
← bu uchta badge tepada

Description matni (3-4 jumla, to'liq)

┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Capital │ │Population│ │  Area   │ │Language │
│W.D.C    │ │ 335M    │ │9.8M km²│ │ English │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
← bu to'rtta info chip pastda

VAZIFA 3 — ASSET GRID YAXSHILASH:
- Grid: mobile 2, tablet 3, desktop 4 ustun
- Har karta: preview + nom + "5 FORMATS" badge + Free/Premium chip
- Hover: slight shadow + scale(1.02)
- "Sort by": Newest / Popular / Price (dropdown)
- Agar 8+ asset bo'lsa: "Show all [N] flags" tugmasi

VAZIFA 4 — EMPTY STATE:
Agar davlat uchun asset yo'q bo'lsa:
"No assets yet for [Country]. 
 Want this flag? → [Request Flag] tugmasi"
→ /api/flag-requests POST

src/components/country/CountryHeader.tsx sifatida yarat.
src/components/country/InfoChips.tsx sifatida yarat.
```

---

## P-43 — PLACEHOLDER TEXTLARNI FLAGSWING UCHUN MAXSUS ALMASHTIRISH

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/ papkasidagi BARCHA sahifalarni qidir.
Quyidagi placeholder va generik matnlarni Flagswing uchun maxsus almashtir:

ALMASHTIRISH RO'YXATI:

1. Email manzillar:
   "hello@yourdomain.com"     → "hello@flagswing.com"
   "support@yourdomain.com"   → "support@flagswing.com"
   "contact@yourdomain.com"   → "hello@flagswing.com"
   "legal@yourdomain.com"     → "legal@flagswing.com"
   "press@yourdomain.com"     → "press@flagswing.com"
   "info@yourdomain.com"      → "hello@flagswing.com"
   "[your email]"             → "hello@flagswing.com"
   "your@email.com"           → "hello@flagswing.com"

2. Kompaniya nomi:
   "[Legal name of the entity]"  → "Flagswing"
   "[Company Name]"              → "Flagswing"
   "[Your Company]"              → "Flagswing"
   "PLACEHOLDER"                 → tegishli Flagswing qiymat

3. URL lar:
   "yourdomain.com"           → "flagswing.com"
   "your-domain.com"          → "flagswing.com"
   "example.com"              → "flagswing.com"

4. Manzil:
   "[Your Address]"           → "Flagswing, Online"
   "[City, Country]"          → olib tashla (online biznes)

5. env orqali o'qiladigan joylar:
   Agar sahifada process.env.NEXT_PUBLIC_CONTACT_EMAIL bo'lsa — 
   shu env ga "hello@flagswing.com" default qo'y

Topilgan har bir fayl nomini va qator raqamini ayt.
O'zgartirilgan joylar sonini xulosa qil.
```

---

## P-44 — FAQ SAHIFASI — TO'LIQ QAYTA YOZISH

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/faq/ yoki /help/ sahifasini toping va o'qi.

FAQ sahifasining barcha matnini Flagswing uchun maxsus qayta yoz:

STRUKTURA:
- Accordion (ochildi/yopildi) — har savol
- Kategoriyalarga bo'lish: General / Downloads / Licensing / Billing / Technical

KATEGORIYA 1 — GENERAL:

Q: What is Flagswing?
A: Flagswing is a specialized flag asset library offering the world's most comprehensive collection of flag graphics. We provide national flags, historical empire flags, autonomous region flags, and creative compositions in multiple formats — from free SVG downloads to premium 4K video loops. Whether you're a designer, journalist, educator, or developer, Flagswing has the flag assets you need.

Q: How many flags do you have?
A: We currently offer 250+ flag assets across 195 independent states, 50 US states, dozens of autonomous regions, and 20+ historical empires and former nations. We add new assets every week. Can't find a flag? Use the "Request a Flag" feature and we'll add it.

Q: What makes Flagswing different from free icon sites?
A: Most free sites like Flaticon offer generic flat icons. Flagswing goes deeper: official color codes (HEX, CMYK, Pantone), multiple shapes (sphere, heart, star, wave), 4K video loops, geopolitical compositions, historical flag archives, and clear commercial licensing — all in one place focused exclusively on flags.

KATEGORIYA 2 — DOWNLOADS:

Q: How do I download a free flag?
A: Simply find the flag you need, click the "Download Free" button, and the SVG + PNG files will download instantly — no account required, no email needed.

Q: What formats are included with free downloads?
A: Free flat flags include SVG and PNG formats. Premium assets include SVG, PNG, EPS, and PDF formats. Video assets are available as MP4 and MOV.

Q: Can I use the flags offline?
A: Yes. Once downloaded, flag files are yours to keep and use offline indefinitely according to your license terms.

Q: What is the maximum resolution available?
A: SVG and EPS files are vector format — infinitely scalable with no quality loss. PNG files are available up to 4000×2667px. Video files are available in 4K (3840×2160px).

KATEGORIYA 3 — LICENSING:

Q: Can I use Flagswing flags commercially?
A: Free flat flags: yes, for personal and commercial use with no attribution required. Premium assets include a Commercial License — use in client work, advertising, merchandise, and digital media. Enterprise and Extended licenses available for broadcast and large-scale use.

Q: Do I need to credit Flagswing?
A: No attribution required for any Flagswing asset — free or premium.

Q: Can I use flags in merchandise (t-shirts, mugs, etc.)?
A: Yes, with a Premium or Extended license. Free flag licenses cover digital and print use but exclude merchandise in large quantities (500+ units). For bulk merchandise, contact us at hello@flagswing.com.

Q: Are historical flags (Soviet Union, Ottoman Empire) safe to use commercially?
A: Yes. Historical flags of dissolved states and empires are generally in the public domain. Our historical flag assets are cleared for commercial use. Always verify local regulations for your specific jurisdiction.

KATEGORIYA 4 — BILLING:

Q: What payment methods do you accept?
A: We accept all major credit and debit cards (Visa, Mastercard, American Express) via Paddle — our secure payment processor. No PayPal currently.

Q: Can I get a refund?
A: Due to the digital nature of our products, we generally don't offer refunds after download. However, if a file is corrupted or significantly different from what was described, contact support@flagswing.com within 7 days and we'll make it right.

Q: Do you offer invoices for business purchases?
A: Yes. After purchase, an invoice is automatically emailed to you. Enterprise customers receive custom invoices — contact hello@flagswing.com.

Q: Is the annual subscription auto-renewed?
A: Yes, annual subscriptions auto-renew unless cancelled. You'll receive a reminder email 30 days before renewal. Cancel anytime from your account dashboard.

KATEGORIYA 5 — TECHNICAL:

Q: What software can I open SVG files with?
A: SVG files work in Adobe Illustrator, Inkscape (free), Figma, Sketch, Affinity Designer, and any modern web browser. They can also be used directly in HTML/CSS.

Q: The flag colors look different on my screen. Why?
A: Monitors display colors differently. For accurate color reproduction, use our official color codes (HEX, RGB, CMYK, Pantone) listed on each flag page. For print, always use the CMYK values.

Q: Can I use Flagswing flags in my web application via CDN?
A: Yes — embed flags directly via our CDN links available on each flag page. For programmatic access, check our API documentation at flagswing.com/api-docs.

Q: I found a flag with an error. How do I report it?
A: Email us at support@flagswing.com with the flag name and description of the issue. We aim to fix reported errors within 48 hours.

---

Sahifani accordion formatida yozib ber.
Har kategoriya alohida bo'lim.
src/app/faq/page.tsx — generateMetadata bilan:
title: "FAQ — Frequently Asked Questions | Flagswing"
description: "Find answers about downloading flags, licensing, billing, and technical questions at Flagswing."
```

---

## P-45 — BLOG SAHIFASI — TIZIM VA DASTLABKI POSTLAR

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/blog/ sahifasini toping va o'qi.
apps/frontend/content/ papkasida blog postlar bormi tekshir.

VAZIFA 1 — BLOG SAHIFASI TUZILMASI:

/blog sahifasi:
- Hero: "Flag Stories & Design Resources"
- Subtitle: "Insights on flags, history, design, and visual storytelling"
- Grid: 3 ustun (tablet: 2, mobile: 1)
- Har post karta: cover image + kategoriya + sarlavha + 2 jumla excerpt + sana + "Read more →"
- Filter tabs: All / Design / History / Geopolitics / Tutorials

/blog/[slug] sahifasi:
- Breadcrumb: Blog / [kategoriya] / [sarlavha]
- MDX yoki JSON based content
- Related posts (2-3 ta) pastda

VAZIFA 2 — 6 TA DASTLABKI BLOG POST YARAT:

apps/frontend/content/blog/ papka yaratib quyidagi postlarni yoz:

POST 1 — history/soviet-union-flag-history.mdx:
---
title: "The Soviet Union Flag: History, Symbolism, and Design"
slug: "soviet-union-flag-history"
category: "History"
date: "2026-01-15"
excerpt: "The iconic hammer and sickle on red — how the USSR flag became one of the most recognizable symbols of the 20th century."
coverImage: "/blog/soviet-flag.jpg"
---
[To'liq 400-500 so'zlik matn yoz: 1917 dan 1991 gacha tarixi, rang ma'nosi, dizayn o'zgarishlari, hozirgi ta'siri. SEO: "Soviet Union flag history", "USSR flag meaning", "hammer sickle symbolism"]

POST 2 — design/flag-colors-guide.mdx:
---
title: "Official Flag Colors: Why HEX Codes Aren't Enough for Print"
slug: "flag-colors-hex-cmyk-pantone-guide"
category: "Design"
date: "2026-01-22"
excerpt: "Your flag looks perfect on screen but wrong in print. Here's why CMYK and Pantone matter for professional flag design."
---
[400-500 so'z: screen vs print rang farqi, HEX vs CMYK vs Pantone tushuntirish, professional bayroq dizayn uchun amaliy maslahatlar]

POST 3 — tutorials/svg-flags-web-developers.mdx:
---
title: "Using SVG Flags in Web Projects: A Developer's Guide"
slug: "svg-flags-web-development-guide"
category: "Tutorials"
date: "2026-01-29"
excerpt: "Inline SVG, img tags, CSS backgrounds, or CDN? The definitive guide to using flag SVGs in your web application."
---
[400-500 so'z: inline SVG vs img tag, CSS background, React komponent, CDN embed, performance maslahatlar, kod misollar]

POST 4 — geopolitics/world-cup-2026-flags.mdx:
---
title: "FIFA World Cup 2026: All 32 Participating Nations and Their Flags"
slug: "world-cup-2026-participating-nations-flags"
category: "Geopolitics"
date: "2026-02-05"
excerpt: "From the Americas to Asia — meet all 32 nations competing in the 2026 FIFA World Cup with full flag histories."
---
[400-500 so'z: 32 ta davlat ro'yxati, har birining bayrog'i haqida qisqacha, tarixiy qiziqarli faktlar. SEO: "World Cup 2026 flags", "FIFA 2026 countries"]

POST 5 — history/timurid-empire-flag.mdx:
---
title: "The Timurid Empire Flag: Central Asia's Golden Age of Art and Power"
slug: "timurid-empire-flag-history"
category: "History"
date: "2026-02-12"
excerpt: "Timur the Great built one of history's most sophisticated empires. Discover the symbols and colors that represented his dynasty."
---
[400-500 so'z: Temuriylar imperiyasi tarixi, bayroq va ramzlar, Samarqand, Hirot madaniyati, hozirgi O'zbekiston bilan bog'liqligi. SEO: "Timurid Empire flag", "Timur flag history", "Uzbekistan historical flags"]

POST 6 — design/independence-day-flag-design-tips.mdx:
---
title: "Independence Day Graphics: 7 Ways to Use Flag Assets Professionally"
slug: "independence-day-flag-design-tips"
category: "Design"
date: "2026-02-19"
excerpt: "Social media posts, event banners, email headers — here's how professionals use flag assets for national day campaigns."
---
[400-500 so'z: 7 ta amaliy maslahat, har biri uchun qaysi asset turi mos, litsenziya eslatmasi, Flagswing assetlarini tavsiya etish. SEO: "independence day flag graphics", "national day flag design"]

VAZIFA 3 — SEO:
/blog sahifasi metadata:
title: "Blog — Flag Design, History & Resources | Flagswing"
description: "Explore flag histories, design tutorials, and geopolitical insights from the Flagswing team."

Har post uchun generateMetadata (slug dan).
```

---

## P-46 — FOOTER SAHIFALARI — TO'LIQ KONTENT

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/ papkasidagi quyidagi sahifalarni toping va BARCHASINI qayta yoz:

--- ABOUT SAHIFASI (/about) ---

title: "About Flagswing"
description: "Our mission and story"

MATN:

# About Flagswing

Flagswing is the world's most comprehensive flag asset library, built for designers, journalists, educators, and developers who need professional flag graphics without the hassle of scattered sources and unclear licensing.

## Our Mission
Every flag tells a story — of nations, history, identity, and aspiration. We believe these stories deserve to be told with accurate, high-quality visuals. Our mission is to make every flag in the world accessible, properly licensed, and professionally formatted for any creative use.

## What We Offer
From free SVG flat flags to premium 4K video loops, from modern national flags to historical empire archives — Flagswing covers it all:
- 250+ flags across independent states, US states, autonomous regions, and territories
- Historical flags: Soviet Union, Ottoman Empire, Timurid Dynasty, Byzantine Empire, and more
- Multiple formats: SVG, PNG, EPS, PDF, and MP4 video
- Official color codes: HEX, RGB, CMYK, and Pantone for every flag
- Creative compositions: sphere, heart, star, wave, map shapes, and geopolitical pairings
- Clear commercial licensing with every download

## For Designers
Get the exact colors, vectors, and mockups you need. No more hunting through generic stock sites for a flag that meets your quality standards.

## For Journalists & Media
Access editorially licensed flag assets for news, analysis, and media production — with clear usage rights and instant downloads.

## For Developers
Use our CDN, API, or downloadable SVG packs to integrate accurate flag graphics into your web and mobile applications.

## Contact
Questions, partnerships, or custom licensing inquiries:
General: hello@flagswing.com
Support: support@flagswing.com
Press: press@flagswing.com
Legal: legal@flagswing.com

--- CAREERS SAHIFASI (/careers) ---

# Join Flagswing

We're a small, remote-first team passionate about flags, design, and building useful tools. We don't have open positions right now, but we're always interested in hearing from talented people.

## What We Look For
- Frontend developers with Next.js experience
- Graphic designers with flag or heraldic design knowledge
- Content writers with history or geopolitics background
- SEO and growth specialists

## How to Reach Us
Send your portfolio and a note about yourself to hello@flagswing.com with subject line "Careers — [Your Role]". We read every email.

--- PRESS KIT SAHIFASI (/press) ---

# Press & Media

## About Flagswing (Short Version)
Flagswing is a specialized flag asset library offering 250+ national, historical, and creative flag graphics in SVG, PNG, EPS, and video formats. Founded with the mission to make professional flag assets accessible to designers, journalists, and developers worldwide.

## Media Assets
- Flagswing logo (SVG, PNG — light and dark versions)
- Screenshot gallery
- Founder photos (available on request)

## Press Contact
press@flagswing.com
Response time: within 24 hours

--- CONTACT SAHIFASI (/contact) ---

# Contact Us

**General inquiries:** hello@flagswing.com
**Customer support:** support@flagswing.com
**Press & media:** press@flagswing.com
**Legal & licensing:** legal@flagswing.com
**Enterprise sales:** hello@flagswing.com

Contact form:
- Ism
- Email
- Mavzu (dropdown): General Question / Support / Licensing / Press / Enterprise / Other
- Xabar
- "Send Message" tugmasi → /api/contact POST → admin ga email

We typically respond within 24 hours on business days.

---

Har sahifada generateMetadata yoz.
Mavjud sahifa bo'lsa — mavjud strukturani saqlagan holda faqat matnni yangilab ber.
Mavjud bo'lmasa — yangi page.tsx yaratib ber.
```

---

## P-47 — LEGAL SAHIFALAR — FLAGSWING UCHUN MAXSUS

```
D:\flagim\iflag loyihasida ishlayman.
apps/frontend/src/app/ papkasidagi legal sahifalarni toping:
- /privacy-policy
- /terms-of-service  
- /refund-policy
- /licensing-usage
- /cookie-policy

Barcha placeholder va generik matnlarni Flagswing uchun maxsus almashtir.
Har sahifada quyidagilarni o'zgartir:

UMUMIY O'ZGARTIRISHLAR (barcha legal sahifalarda):
- "[Company Name]" → "Flagswing"
- "[Legal name]" → "Flagswing"
- "yourdomain.com" → "flagswing.com"
- "[contact@yourdomain.com]" → "legal@flagswing.com"
- "[Date]" → "January 1, 2026"
- "[Your Country/State]" → olib tashla yoki "International"
- Har sahifa tepa va pastida: "Last updated: January 1, 2026"

LICENSING & USAGE sahifasi (/licensing-usage) — TO'LIQ QAYTA YOZ:

# Licensing & Usage Guide

## Free License (Flat Flags)
All flat flag SVG and PNG downloads are free and available under the Flagswing Free License:
✓ Personal and commercial use
✓ Digital media (websites, apps, presentations, social media)
✓ Print (brochures, books, educational materials)
✓ No attribution required
✗ Resale of the files themselves
✗ Inclusion in competing flag asset products

## Premium License ($3 per asset / $12 per bundle)
Includes everything in Free License, plus:
✓ Extended commercial use (advertising, marketing campaigns)
✓ Client work and agency use
✓ Merchandise (up to 500 units)
✓ Broadcast and editorial use
✓ All formats: SVG, PNG, EPS, PDF

## Annual Subscription License ($99/year)
Unlimited downloads with Premium License terms for all assets during the subscription period.

## Enterprise License (Custom pricing)
For organizations requiring:
✓ Team access (multiple users)
✓ Merchandise over 500 units
✓ Broadcast rights
✓ Custom legal agreements
Contact: hello@flagswing.com

## What You Cannot Do (All Licenses)
✗ Claim ownership of the flag designs themselves (flags are national symbols)
✗ Resell or redistribute the files as-is
✗ Use in products that compete directly with Flagswing
✗ Remove watermarks from preview files

## Historical & Government Flags
Note: While our files are licensed for use, some national symbols may have additional legal restrictions in specific countries regarding commercial use. Users are responsible for verifying local regulations.

Questions? Email: legal@flagswing.com

---

REFUND POLICY (/refund-policy) — QAYTA YOZ:

# Refund Policy

Last updated: January 1, 2026

## Digital Downloads
Due to the instant digital delivery nature of our products, we generally do not offer refunds after a file has been downloaded.

## When We Do Refund
We will issue a full refund if:
- The file is corrupted and cannot be opened
- The delivered file is significantly different from what was shown in the preview
- You were charged twice for the same order
- Technical issues prevented successful download and we cannot resolve them

## How to Request a Refund
Email support@flagswing.com within 7 days of purchase with:
- Your order ID (found in your purchase confirmation email)
- Description of the issue
- Screenshot or evidence of the problem

We respond to all refund requests within 2 business days.

## Subscriptions
Annual subscriptions may be cancelled at any time. Cancellations take effect at the end of the current billing period. We do not offer partial refunds for unused subscription time.

---

Har legal sahifada topilgan placeholder sayonini xulosa qil.
Muhim: mavjud legal tuzilmani buzma — faqat placeholder matnlarni almashtir.
```

---

# ISHLATISH TARTIBI

## Birinchi (tez natija):
P-43 → Barcha placeholder emaillar tozalanadi (30 daqiqa)
P-41 → Asset detail navigatsiya + related variants (1-2 soat)
P-42 → Country folder UX yaxshilanishi (1-2 soat)

## Ikkinchi:
P-46 → Footer sahifalar: About, Careers, Press, Contact (2-3 soat)
P-47 → Legal sahifalar tozalash (1-2 soat)

## Uchinchi:
P-44 → FAQ to'liq qayta yozish (2-3 soat)
P-45 → Blog tizimi + 6 ta post (3-4 soat)

---

# UMUMIY PROMPT HISOBI
flagswing_all_prompts.md:     P-01 — P-22 = 22 ta prompt
flagswing_revenue_prompts.md: P-23 — P-40 = 18 ta prompt
Bu fayl:                      P-41 — P-47 =  7 ta prompt
─────────────────────────────────────────────────────
JAMI FLAGSWING PROMPT'LARI:              47 ta prompt
