import express from 'express';
import path from 'path';
import {
  getAssetById,
  getAssetBySlug,
  createAsset,
  updateAsset,
  deleteAsset,
  getDownloadUrl,
  recordDownload,
} from './asset.service.js';
import {
  getPublishedCountryFlagById,
  listPublishedCountryFlagFiles,
  type PublishedCountryFlagDTO,
} from './country-flag-files-public.service.js';
import { authenticateToken, optionalAuth, requireAdmin, AuthRequest } from '../auth/auth.middleware.js';
import { listR2ObjectSummaries, getPublicR2Url, requireR2Config } from '../storage/r2.js';
import { getCanonicalCountryByIso, getCanonicalCountryBySlug } from '../lib/canonical-countries.js';

const PREVIEWABLE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg']);
const FLAG_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.eps', '.ai', '.pdf', '.psd', '.mp4', '.webm', '.mov']);
const R2_DIRECT_COUNTRY_MAX_OBJECTS = Math.min(
  20_000,
  Math.max(500, Number(process.env.R2_COUNTRY_DIRECT_MAX_OBJECTS ?? 20_000) || 20_000),
);

function r2PublicUrlFromKey(publicUrlBase: string, key: string): string {
  const encodedKey = key
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${publicUrlBase.replace(/\/+$/, '')}/${encodedKey}`;
}

function titleCaseWords(input: string): string {
  return input
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function addCandidateKey(out: Set<string>, raw: string | null | undefined) {
  const value = raw?.trim();
  if (value) out.add(value);
}

function compactCountryKey(raw: string | null | undefined): string {
  return raw?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') ?? '';
}

function r2CountryPrefixCandidates(slugRaw: string): string[] {
  const slug = slugRaw.trim().toLowerCase();
  const canonical = getCanonicalCountryBySlug(slug) ?? (slug.length === 2 ? getCanonicalCountryByIso(slug) : null);
  const name = canonical?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const code = canonical?.code ?? (slug.length === 2 ? slug : '');
  const spacedSlug = slug.replace(/-/g, ' ');

  const keys = new Set<string>();
  addCandidateKey(keys, slug);
  addCandidateKey(keys, canonical?.slug);
  addCandidateKey(keys, name);
  addCandidateKey(keys, name.toLowerCase());
  addCandidateKey(keys, name.replace(/\s+/g, '-').toLowerCase());
  addCandidateKey(keys, compactCountryKey(name));
  addCandidateKey(keys, compactCountryKey(slug));
  addCandidateKey(keys, name.replace(/\s+/g, ''));
  addCandidateKey(keys, titleCaseWords(spacedSlug).replace(/\s+/g, ''));
  addCandidateKey(keys, spacedSlug);
  addCandidateKey(keys, titleCaseWords(spacedSlug));
  addCandidateKey(keys, code.toLowerCase());
  addCandidateKey(keys, code.toUpperCase());
  if ((canonical?.slug ?? slug).toLowerCase() === 'south-korea') {
    addCandidateKey(keys, 'korea');
    addCandidateKey(keys, 'Korea');
    addCandidateKey(keys, 'republic-of-korea');
    addCandidateKey(keys, 'Republic of Korea');
    addCandidateKey(keys, 'rok');
    addCandidateKey(keys, 'ROK');
  }
  if ((canonical?.slug ?? slug).toLowerCase() === 'myanmar' || slug.includes('birmania')) {
    addCandidateKey(keys, 'Myanmar (Birmania)');
    addCandidateKey(keys, 'Myanmar Birmania');
    addCandidateKey(keys, 'myanmar-birmania');
    addCandidateKey(keys, 'Birmania');
    addCandidateKey(keys, 'Burma');
  }
  if (slug === 'us-states') {
    addCandidateKey(keys, 'US States');
    addCandidateKey(keys, 'U.S. States');
    addCandidateKey(keys, 'USA States');
    addCandidateKey(keys, 'Usa States');
    addCandidateKey(keys, 'United States States');
    addCandidateKey(keys, 'American States');
    addCandidateKey(keys, 'use states');
    addCandidateKey(keys, 'USE States');
  }

  const prefixes = new Set<string>();
  for (const key of keys) {
    prefixes.add(`flags/${key}/`);
    prefixes.add(`${key}/`);
  }
  return [...prefixes];
}

function r2ObjectToFlagDto(key: string, size: number, publicUrlBase: string, countrySlug: string, countryName: string): PublishedCountryFlagDTO {
  const filename = key.split('/').pop() ?? key;
  const ext = path.extname(filename).replace(/^\./, '').toLowerCase() || 'bin';
  const fileUrl = r2PublicUrlFromKey(publicUrlBase, key);
  const isPreviewable = PREVIEWABLE_EXTS.has(`.${ext}`);
  const id = `r2-${key.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
  const now = new Date().toISOString();
  return {
    id,
    title: null,
    country_slug: countrySlug,
    country_name: countryName,
    file_name: filename.replace(/\.[^.]+$/, ''),
    file_key: key,
    file_path: key,
    file_url: fileUrl,
    thumbnail_url: isPreviewable ? fileUrl : null,
    preview_url: isPreviewable ? fileUrl : null,
    format: ext,
    mime_type: null,
    file_size_bytes: size || null,
    variant_name: filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    premium_tier: 'paid',
    price_cents: 0,
    watermark_enabled: false,
    tags: null,
    status: 'published',
    storage_provider: 'r2',
    processing_status: 'completed',
    iso_alpha_2: null,
    region: null,
    created_at: now,
    updated_at: now,
    asset_group_key: null,
    display_title: filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    ratio: null,
  };
}

async function listDirectR2CountryFlagDtos(
  countrySlug: string,
  countryName: string,
  opts: {
    format?: string;
    premiumTier?: string;
    existingKeys?: Set<string>;
  } = {},
): Promise<PublishedCountryFlagDTO[]> {
  const tier = opts.premiumTier?.trim().toLowerCase();
  if (tier && tier !== 'paid') return [];

  const cfg = requireR2Config();
  const format = opts.format?.trim().toLowerCase();
  const prefixes = r2CountryPrefixCandidates(countrySlug);
  const seenKeys = new Set<string>(opts.existingKeys ?? []);
  const rows: PublishedCountryFlagDTO[] = [];

  for (const prefix of prefixes) {
    try {
      const found = await listR2ObjectSummaries(cfg, { prefix, maxObjects: R2_DIRECT_COUNTRY_MAX_OBJECTS });
      for (const obj of found) {
        if (seenKeys.has(obj.key)) continue;
        const ext = path.extname(obj.key).replace(/^\./, '').toLowerCase();
        if (!FLAG_EXTS.has(`.${ext}`)) continue;
        if (
          format &&
          ext !== format &&
          !(format === 'jpg' && ext === 'jpeg') &&
          !(format === 'jpeg' && ext === 'jpg')
        ) {
          continue;
        }
        seenKeys.add(obj.key);
        rows.push(r2ObjectToFlagDto(obj.key, obj.size, cfg.publicUrlBase, countrySlug, countryName));
      }
    } catch {
      // Keep the list responsive when an alias prefix is absent or unavailable.
    }
  }

  return rows;
}

const router = express.Router();

function parseListQuery(req: express.Request) {
  const qRaw = req.query.q ?? req.query.search;
  const q = Array.isArray(qRaw) ? String(qRaw[0]) : qRaw ? String(qRaw) : undefined;
  const searchRaw = req.query.search;
  const search = Array.isArray(searchRaw) ? String(searchRaw[0]) : searchRaw ? String(searchRaw) : undefined;

  const pageRaw = req.query.page;
  const page = pageRaw ? parseInt(String(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw), 10) : undefined;
  const limitRaw = req.query.limit;
  const limit = limitRaw ? parseInt(String(Array.isArray(limitRaw) ? limitRaw[0] : limitRaw), 10) : undefined;

  const sortRaw = req.query.sort;
  const sort = (Array.isArray(sortRaw) ? sortRaw[0] : sortRaw)
    ? String(Array.isArray(sortRaw) ? sortRaw[0] : sortRaw)
    : undefined;

  const countrySlugRaw = req.query.country_slug;
  const country_slug = countrySlugRaw
    ? String(Array.isArray(countrySlugRaw) ? countrySlugRaw[0] : countrySlugRaw)
    : undefined;

  const formatRaw = req.query.format;
  const format = formatRaw ? String(Array.isArray(formatRaw) ? formatRaw[0] : formatRaw) : undefined;

  const tierRaw = req.query.premium_tier;
  const premium_tier = tierRaw ? String(Array.isArray(tierRaw) ? tierRaw[0] : tierRaw) : undefined;

  return {
    q: q?.trim() || search?.trim(),
    search: search?.trim(),
    page,
    limit,
    sort: sort as 'newest' | 'oldest' | 'title' | 'popular' | undefined,
    country_slug,
    format,
    premium_tier,
  };
}

/**
 * GET /api/assets — published `country_flag_files` (R2 / Neon), paginated.
 * Query: q | search, country_slug, format, premium_tier, page, limit, sort
 */
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const f = parseListQuery(req);
    const result = await listPublishedCountryFlagFiles({
      q: f.q,
      search: f.search,
      country_slug: f.country_slug,
      format: f.format,
      premium_tier: f.premium_tier,
      page: f.page,
      limit: f.limit,
      sort: f.sort === 'popular' ? 'newest' : f.sort,
    });

    // R2 direct merge: include files uploaded straight to R2 before background sync imports them.
    if (f.country_slug && !f.q && !f.search && (result.page ?? 1) === 1) {
      try {
        const slug = f.country_slug.trim().toLowerCase();
        const existingKeys = new Set(
          result.data
            .map((row) => row.file_key?.trim())
            .filter((key): key is string => Boolean(key)),
        );
        const countryName =
          result.data[0]?.country_name?.trim() ||
          slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const directRows = await listDirectR2CountryFlagDtos(slug, countryName, {
          format: f.format,
          premiumTier: f.premium_tier,
          existingKeys,
        });
        if (directRows.length > 0) {
          return res.json({
            source: result.data.length > 0 ? 'country_flag_files+r2_direct' : 'r2_direct',
            data: [...result.data, ...directRows],
            total: result.total + directRows.length,
            page: result.page,
            limit: result.limit + directRows.length,
            hasMore: result.hasMore,
          });
        }
      } catch {
        // R2 not configured or listing failed — proceed with empty DB result
      }
    }

    res.json({
      source: 'country_flag_files',
      ...result,
    });
  } catch (error) {
    console.error('[assets] list country_flag_files error:', error);
    res.status(500).json({ error: 'Failed to list assets' });
  }
});

/** GET /api/assets/search — alias of GET / (stock-style path). */
router.get('/search', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const f = parseListQuery(req);
    const result = await listPublishedCountryFlagFiles({
      q: f.q,
      search: f.search,
      country_slug: f.country_slug,
      format: f.format,
      premium_tier: f.premium_tier,
      page: f.page,
      limit: f.limit,
      sort: f.sort === 'popular' ? 'newest' : f.sort,
    });
    res.json({
      source: 'country_flag_files',
      ...result,
    });
  } catch (error) {
    console.error('[assets] search country_flag_files error:', error);
    res.status(500).json({ error: 'Failed to search assets' });
  }
});

// GET /api/assets/slug/:slug — legacy `assets` CMS by slug
router.get('/slug/:slug', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const asset = await getAssetBySlug(slug);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if ((!req.user || req.user.role !== 'admin') && asset.status !== 'published') {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ source: 'legacy_asset', ...asset });
  } catch (error) {
    console.error('Get asset by slug error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// GET /api/assets/:id/download — legacy `assets` table download flow
router.get('/:id/download', optionalAuth, async (req: AuthRequest, res) => {
  const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
    const userAgent = req.headers['user-agent'] || undefined;

    const { url, type } = await getDownloadUrl(assetId, req.user?.userId);

    await recordDownload(assetId, req.user?.userId || null, type, ipAddress, userAgent);

    res.json({ url, type });
  } catch (error: any) {
    if (error.message === 'Asset not found' || error.message === 'Asset not available') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Get download URL error:', error);
    res.status(500).json({ error: 'Failed to get download URL' });
  }
});

/**
 * GET /api/assets/:id — prefer published `country_flag_files` by UUID; else legacy `assets`.
 */
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const flag = await getPublishedCountryFlagById(assetId);
    if (flag) {
      return res.json({ source: 'country_flag_file', ...flag });
    }

    const asset = await getAssetById(assetId, req.user?.userId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if ((!req.user || req.user.role !== 'admin') && asset.status !== 'published') {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ source: 'legacy_asset', ...asset });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST /api/assets - Create asset (admin only) — legacy CMS
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const asset = await createAsset(req.body, req.user!.userId);
    res.status(201).json(asset);
  } catch (error: any) {
    if (error.message === 'Asset with this title already exists') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Create asset error:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// PUT /api/assets/:id - Update asset (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const asset = await updateAsset(assetId, req.body);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/assets/:id - Delete asset (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const assetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await deleteAsset(assetId);
    if (!deleted) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

export default router;
