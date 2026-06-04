import type { MetadataRoute } from 'next';
import { getSiteOrigin } from '@/lib/seo/site-config';

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/sign-in',
          '/sign-up',
          '/dashboard',
          '/profile',
          '/subscriptions',
          '/cart',
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
