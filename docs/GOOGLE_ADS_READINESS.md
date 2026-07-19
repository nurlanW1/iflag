# Google Ads readiness checklist for Flagswing

Use this before sending traffic from Google Ads.

## Site requirements

- HTTPS: production must use https://flagswing.com.
- Mobile: primary pages are responsive and use a shared navbar/footer.
- Speed: gallery and club-logo APIs use caching; avoid uncached bulk R2 scans on landing pages.
- Privacy Policy: /privacy-policy.
- Terms of Service: /terms-of-service.
- Refund Policy: /refunds.
- Contact page: /contact.
- About page: /about.

## Public contact details

- Email: nurlanrahmonqulov@gmail.com
- Phone: +998 97 566 79 96

These are wired through the footer, contact page, About page, legal pages, and Organization JSON-LD.

## Required production environment variables

Set these in the frontend production environment, not only locally:

```env
NEXT_PUBLIC_SITE_URL=https://flagswing.com
NEXT_PUBLIC_CONTACT_EMAIL=nurlanrahmonqulov@gmail.com
NEXT_PUBLIC_CONTACT_PHONE_DISPLAY=+998 97 566 79 96
NEXT_PUBLIC_CONTACT_PHONE_TEL=+998975667996

# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Google Ads tag, if using conversion tracking / remarketing
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXXX

# Search Console meta verification if not using the static HTML file
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-token
```

Search Console can also be verified with the existing static file under `apps/frontend/public/googlecd630c82a2f34c07.html`.

## Manual Google-side steps

1. Add and verify `https://flagswing.com` in Google Search Console.
2. Submit `https://flagswing.com/sitemap.xml`.
3. Create a GA4 property and set `NEXT_PUBLIC_GA_ID`.
4. Create/link a Google Ads account and set `NEXT_PUBLIC_GOOGLE_ADS_ID` when you enable conversion tracking.
5. In Google Ads, use final URLs that match the visible domain, for example `https://flagswing.com/vs-designer`, `/gallery`, or `/pricing`.

## Do not do

- Do not send ad clicks directly to downloads, files, emails, or API routes.
- Do not claim official affiliation with governments, football clubs, federations, Shutterstock, Pixabay, or Pexels unless a page clearly states that relationship.
- Do not advertise offers that are hidden behind broken checkout, missing pricing, or unavailable pages.
