import type { MetadataRoute } from 'next';
import { getDb } from '@/lib/server/db';
import { getSiteOrigin } from '@/lib/seo/site-config';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // rebuild every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const now = new Date();

  // ── Static pages ─────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${origin}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${origin}/gallery`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${origin}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${origin}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${origin}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${origin}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${origin}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${origin}/licenses`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${origin}/privacy-policy`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${origin}/terms-of-service`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${origin}/refunds`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${origin}/cookies`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // ── Category hub pages ────────────────────────────────────────────────────
  const categoryRoutes: MetadataRoute.Sitemap = [
    { url: `${origin}/gallery?kind=historical`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${origin}/gallery?kind=organizations`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${origin}/gallery?kind=autonomy`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${origin}/flags/historical`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${origin}/flags/us-states`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${origin}/flags/autonomous`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${origin}/bundles`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${origin}/generate`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${origin}/editor`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  // ── Dynamic country gallery pages ─────────────────────────────────────────
  let countryRoutes: MetadataRoute.Sitemap = [];
  try {
    const pool = getDb();
    const result = await pool.query<{ slug: string; updated_at: Date | null }>(
      `SELECT c.slug, MAX(f.updated_at) AS updated_at
       FROM countries c
       LEFT JOIN country_flag_files f ON f.country_id = c.id
         AND lower(trim(coalesce(f.status::text,''))) = 'published'
       WHERE lower(trim(coalesce(c.status::text,''))) = 'published'
       GROUP BY c.slug
       ORDER BY c.slug ASC`,
    );

    countryRoutes = result.rows.map((row) => ({
      url: `${origin}/gallery/${encodeURIComponent(row.slug)}`,
      lastModified: row.updated_at ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.error('[sitemap] Failed to load country slugs:', err);
  }

  return [...staticRoutes, ...categoryRoutes, ...countryRoutes];
}
