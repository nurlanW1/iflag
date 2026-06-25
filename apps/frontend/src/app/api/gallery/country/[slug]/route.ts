import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCountryCode } from '@/lib/country-mapping';
import { COUNTRIES } from '@/lib/countries';
import { getDb } from '@/lib/server/db';
import { buildCountryHubDescription } from '@/lib/gallery/country-hub-copy';
import { fetchCountryGalleryFromBackendApi } from '@/lib/server/gallery-country-detail-fallback';
import { fetchCountryGalleryFromDb, type CountryGalleryPayload } from '@/lib/server/gallery-from-db';
import { getPublicR2PublicBaseUrl, listR2Objects } from '@/lib/server/cloudflare-r2';

export const dynamic = 'force-dynamic';

const WORLD_COUNTRY_PATHS = [
  'D:\\flagim\\Country\\world_country',
  path.join(process.cwd(), '..', '..', 'Country', 'world_country'),
  path.join(process.cwd(), '..', 'Country', 'world_country'),
  path.join(process.cwd(), '..', '..', '..', 'Country', 'world_country'),
];

const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov']);

function findWorldCountryPath(): string | null {
  for (const p of WORLD_COUNTRY_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function findCountryFolder(worldCountryPath: string, slug: string): string | null {
  const norm = slug.toLowerCase().replace(/-/g, ' ');
  try {
    const entries = fs.readdirSync(worldCountryPath);
    return entries.find((e) => e.toLowerCase() === norm) ?? null;
  } catch {
    return null;
  }
}

type VideoVariant = {
  id: string;
  productSlug: string;
  name: string;
  type: string;
  thumbnail: string;
  isPremiumDesign: boolean;
  formats: Array<{
    id: string;
    format: string;
    formatCode: string;
    category: 'video';
    file: string;
    url: string;
    previewUrl: string;
    premiumTier: 'free' | 'paid';
    downloadProtected: boolean;
    size: string;
    dimensions: string;
  }>;
};

function loadDiskVideosForCountry(countrySlug: string): VideoVariant[] {
  const worldCountryPath = findWorldCountryPath();
  if (!worldCountryPath) return [];

  const countryFolder = findCountryFolder(worldCountryPath, countrySlug);
  if (!countryFolder) return [];

  const countryDir = path.join(worldCountryPath, countryFolder);
  const resolvedBase = path.resolve(worldCountryPath);
  const variants: VideoVariant[] = [];

  const scanDir = (dir: string, inFree: boolean) => {
    if (!fs.existsSync(dir)) return;
    let entries: string[];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const file of entries) {
      const ext = path.extname(file).toLowerCase();
      if (!VIDEO_EXTS.has(ext)) continue;
      const filePath = path.join(dir, file);
      if (!path.resolve(filePath).startsWith(resolvedBase)) continue;
      const fileId = `disk-video-${file.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
      let fileSize = 'Unknown';
      try {
        const stat = fs.statSync(filePath);
        fileSize = `${(stat.size / (1024 * 1024)).toFixed(2)} MB`;
      } catch { /* ignore */ }
      const videoUrl = `/api/gallery/video/${encodeURIComponent(countrySlug)}/${encodeURIComponent(file)}`;
      variants.push({
        id: fileId,
        productSlug: fileId,
        name: file.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
        type: 'video',
        thumbnail: videoUrl,
        isPremiumDesign: !inFree,
        formats: [{
          id: `${fileId}-${ext.slice(1)}`,
          format: ext.slice(1).toUpperCase(),
          formatCode: ext.slice(1),
          category: 'video',
          file,
          url: videoUrl,
          previewUrl: videoUrl,
          premiumTier: inFree ? 'free' : 'paid',
          downloadProtected: !inFree,
          size: fileSize,
          dimensions: 'Video',
        }],
      });
    }
  };

  scanDir(countryDir, false);
  scanDir(path.join(countryDir, 'free'), true);

  return variants;
}

function filenameToCountryName(filename: string): string {
  let name = filename.replace(/_flag\.(jpg|jpeg)$/i, '');
  name = name.replace(/_/g, ' ');
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function countryToSlug(country: string): string {
  return country.toLowerCase().replace(/\s+/g, '-');
}

function slugToCountryName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function canonicalCountryForSlug(slug: string) {
  return COUNTRIES.find((country) => country.slug.toLowerCase() === slug.toLowerCase()) ?? null;
}

function emptyCountryHub(slug: string) {
  const canonical = canonicalCountryForSlug(slug);
  const countryName = canonical?.name ?? slugToCountryName(slug);
  const countryCode = canonical?.code.toUpperCase() ?? getCountryCode(countryName);
  return {
    country: {
      name: countryName,
      slug: canonical?.slug ?? slug,
      code: countryCode,
      region: null,
      description: buildCountryHubDescription({
        name: countryName,
        slug: canonical?.slug ?? slug,
        isoCode: countryCode,
        region: null,
        dbDescription: null,
        designCount: 0,
        fileCount: 0,
      }),
      cover_image_url: null,
      has_webp_cover: false,
      webp_cover_url: null,
      file_count: 0,
      design_count: 0,
    },
    variants: [],
  };
}

async function loadFromDatabase(slug: string) {
  if (!process.env.DATABASE_URL?.trim()) return null;
  try {
    const pool = getDb();
    return await fetchCountryGalleryFromDb(pool, slug);
  } catch (err) {
    console.error('[gallery/country] database load failed:', err);
    return null;
  }
}

function loadFromFlagStock(countrySlug: string) {
  const countryName = slugToCountryName(countrySlug);

  const worldCountryPath = findWorldCountryPath();
  const flagStockPath = worldCountryPath
    ? (() => {
        const folder = findCountryFolder(worldCountryPath, countrySlug);
        return folder ? path.join(worldCountryPath, folder, 'free') : null;
      })()
    : null;

  if (!flagStockPath) {
    return null;
  }

  const variants: Array<{
    id: string;
    productSlug: string;
    name: string;
    type: string;
    thumbnail: string;
    formats: Array<{
      id: string;
      format: string;
      formatCode: string;
      category: 'vector' | 'raster' | 'video';
      file: string;
      url: string;
      previewUrl: string;
      premiumTier: 'free';
      downloadProtected: boolean;
      size: string;
      dimensions: string;
    }>;
  }> = [];

  try {
    const files = fs.readdirSync(flagStockPath);

    files.forEach((file) => {
      const lowerFile = file.toLowerCase();
      if (!lowerFile.endsWith('.jpg') && !lowerFile.endsWith('.jpeg') && !lowerFile.endsWith('.png')) return;

      const fileId = file.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const filePath = path.join(flagStockPath!, file);

      let fileSize = 'Unknown';
      try {
        const stats = fs.statSync(filePath);
        fileSize = `${(stats.size / (1024 * 1024)).toFixed(2)} MB`;
      } catch { /* ignore */ }

      const imageUrl = `/api/gallery/video/${encodeURIComponent(countrySlug)}/${encodeURIComponent(file)}`;
      const extCode = path.extname(file).slice(1).toLowerCase() || 'jpg';
      variants.push({
        id: fileId,
        productSlug: fileId,
        name: file.replace(/\.[^.]+$/, '').replace(/_/g, ' ') || 'Standard Flag',
        type: 'standard',
        thumbnail: imageUrl,
        formats: [
          {
            id: `${fileId}-${extCode}`,
            format: extCode.toUpperCase(),
            formatCode: extCode,
            category: 'raster',
            file,
            url: imageUrl,
            previewUrl: imageUrl,
            premiumTier: 'free',
            downloadProtected: false,
            size: fileSize,
            dimensions: 'Original',
          },
        ],
      });
    });
  } catch (err) {
    console.error(`Error reading directory ${flagStockPath}:`, err);
  }

  if (variants.length === 0) {
    return null;
  }

  const countryCode = getCountryCode(countryName);

  const designCount = variants.length;
  const fileCount = variants.reduce((n, v) => n + v.formats.length, 0);

  return {
    country: {
      name: countryName,
      slug: countrySlug,
      code: countryCode,
      region: null,
      description: buildCountryHubDescription({
        name: countryName,
        slug: countrySlug,
        isoCode: countryCode,
        region: null,
        dbDescription: null,
        designCount,
        fileCount,
      }),
      cover_image_url: variants[0]?.thumbnail ?? null,
      has_webp_cover: false,
      webp_cover_url: null,
      file_count: fileCount,
      design_count: designCount,
    },
    variants,
  };
}

const PREVIEWABLE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg']);
const ALL_FLAG_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.eps', '.ai', '.pdf', '.psd', '.mp4', '.webm', '.mov']);
const R2_DIRECT_MAX_OBJECTS = Math.min(
  20_000,
  Math.max(500, Number(process.env.R2_COUNTRY_DIRECT_MAX_OBJECTS ?? 20_000) || 20_000),
);

function normalizedFileStemKey(fileName: string | null | undefined): string {
  return (fileName ?? '')
    .replace(/\.[^.]+$/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
  if (!value) return;
  out.add(value);
}

function compactCountryKey(raw: string | null | undefined): string {
  return raw?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') ?? '';
}

function r2CountryPrefixCandidates(countrySlug: string): string[] {
  const canonical = canonicalCountryForSlug(countrySlug);
  const countryName = canonical?.name ?? slugToCountryName(countrySlug);
  const code = (canonical?.code ?? getCountryCode(countryName) ?? '').trim();
  const spacedSlug = countrySlug.replace(/-/g, ' ');

  const keys = new Set<string>();
  addCandidateKey(keys, countrySlug);
  addCandidateKey(keys, canonical?.slug);
  addCandidateKey(keys, countryName);
  addCandidateKey(keys, countryName.toLowerCase());
  addCandidateKey(keys, countryName.replace(/\s+/g, '-').toLowerCase());
  addCandidateKey(keys, compactCountryKey(countryName));
  addCandidateKey(keys, compactCountryKey(countrySlug));
  addCandidateKey(keys, countryName.replace(/\s+/g, ''));
  addCandidateKey(keys, titleCaseWords(spacedSlug).replace(/\s+/g, ''));
  addCandidateKey(keys, spacedSlug);
  addCandidateKey(keys, titleCaseWords(spacedSlug));
  addCandidateKey(keys, code.toLowerCase());
  addCandidateKey(keys, code.toUpperCase());
  if ((canonical?.slug ?? countrySlug).toLowerCase() === 'south-korea') {
    addCandidateKey(keys, 'korea');
    addCandidateKey(keys, 'Korea');
    addCandidateKey(keys, 'republic-of-korea');
    addCandidateKey(keys, 'Republic of Korea');
    addCandidateKey(keys, 'rok');
    addCandidateKey(keys, 'ROK');
  }
  if ((canonical?.slug ?? countrySlug).toLowerCase() === 'myanmar' || countrySlug.toLowerCase().includes('birmania')) {
    addCandidateKey(keys, 'Myanmar (Birmania)');
    addCandidateKey(keys, 'Myanmar Birmania');
    addCandidateKey(keys, 'myanmar-birmania');
    addCandidateKey(keys, 'Birmania');
    addCandidateKey(keys, 'Burma');
  }
  if (countrySlug.toLowerCase() === 'us-states') {
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

function r2PublicUrlFromKey(base: string, key: string): string {
  const encodedKey = key
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${base.replace(/\/+$/, '')}/${encodedKey}`;
}

async function loadFromR2(countrySlug: string) {
  const r2Base = getPublicR2PublicBaseUrl();
  if (!r2Base) return [];

  const prefixes = r2CountryPrefixCandidates(countrySlug);
  const seenKeys = new Set<string>();
  const allObjects: import('@/lib/server/cloudflare-r2').R2ListEntry[] = [];

  for (const prefix of prefixes) {
    try {
      const found = await listR2Objects(prefix, R2_DIRECT_MAX_OBJECTS);
      for (const obj of found) {
        if (!seenKeys.has(obj.key)) {
          seenKeys.add(obj.key);
          allObjects.push(obj);
        }
      }
    } catch {
      // ignore per-prefix errors
    }
  }

  const variants: Array<{
    id: string;
    productSlug: string;
    name: string;
    type: string;
    thumbnail: string;
    formats: Array<{
      id: string;
      format: string;
      formatCode: string;
      category: 'raster' | 'vector' | 'video';
      file: string;
      url: string;
      previewUrl: string;
      premiumTier: 'paid';
      downloadProtected: boolean;
      size: string;
      dimensions: string;
    }>;
    isPremiumDesign: boolean;
  }> = [];

  for (const obj of allObjects) {
    const ext = path.extname(obj.key).toLowerCase();
    if (!ALL_FLAG_EXTS.has(ext)) continue;
    const filename = obj.key.split('/').pop() ?? obj.key;
    const fileId = `r2-${obj.key.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
    const extCode = ext.slice(1);
    const url = r2PublicUrlFromKey(r2Base, obj.key);
    const isVector = ext === '.svg' || ext === '.eps' || ext === '.ai';
    const isVideo = VIDEO_EXTS.has(ext);
    const isPreviewable = PREVIEWABLE_EXTS.has(ext);
    variants.push({
      id: fileId,
      productSlug: fileId,
      name: filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      type: isVideo ? 'video' : isVector ? 'vector' : 'standard',
      thumbnail: isPreviewable || isVideo ? url : '',
      isPremiumDesign: true,
      formats: [{
        id: `${fileId}-${extCode}`,
        format: extCode.toUpperCase(),
        formatCode: extCode,
        category: isVideo ? 'video' : isVector ? 'vector' : 'raster',
        file: filename,
        url,
        previewUrl: isPreviewable || isVideo ? url : '',
        premiumTier: 'paid',
        downloadProtected: true,
        size: obj.size > 0 ? `${(obj.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
        dimensions: isVideo ? 'Video' : 'Original',
      }],
    });
  }

  const grouped = new Map<string, (typeof variants)[number]>();
  for (const variant of variants) {
    const firstFormat = variant.formats[0];
    const key = normalizedFileStemKey(firstFormat?.file || variant.name) || variant.productSlug;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...variant, formats: [...variant.formats] });
      continue;
    }
    const seenFormats = new Set(existing.formats.map((format) => format.formatCode.toLowerCase()));
    for (const format of variant.formats) {
      const fmt = format.formatCode.toLowerCase();
      if (!seenFormats.has(fmt)) {
        seenFormats.add(fmt);
        existing.formats.push(format);
      }
    }
    if (variant.thumbnail && (!existing.thumbnail || variant.thumbnail.toLowerCase().includes('.webp'))) {
      existing.thumbnail = variant.thumbnail;
    }
  }

  return [...grouped.values()].map((variant) => ({
    ...variant,
    formats: [...variant.formats].sort((a, b) => a.formatCode.localeCompare(b.formatCode)),
  }));
}

function formatIdentity(format: CountryGalleryPayload['variants'][number]['formats'][number]): string {
  return [
    format.id,
    format.previewUrl,
    format.url,
    format.file,
    format.formatCode,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join('|')
    .toLowerCase();
}

function variantIdentity(variant: CountryGalleryPayload['variants'][number]): string {
  const formatKeys = variant.formats.map(formatIdentity).filter(Boolean).join('||');
  return [
    variant.productSlug,
    variant.id,
    variant.name,
    formatKeys,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join('|')
    .toLowerCase();
}

function mergeCountryGalleryPayload(
  base: CountryGalleryPayload,
  extraVariants: CountryGalleryPayload['variants'],
): CountryGalleryPayload {
  if (extraVariants.length === 0) return base;

  const seenVariants = new Set(base.variants.map(variantIdentity));
  const seenFormats = new Set(
    base.variants.flatMap((variant) => variant.formats.map(formatIdentity)).filter(Boolean),
  );
  const added: CountryGalleryPayload['variants'] = [];

  for (const variant of extraVariants) {
    const variantKey = variantIdentity(variant);
    const hasKnownVariant = variantKey && seenVariants.has(variantKey);
    const newFormats = variant.formats.filter((format) => {
      const key = formatIdentity(format);
      return key && !seenFormats.has(key);
    });
    if (hasKnownVariant || newFormats.length === 0) continue;

    for (const format of newFormats) {
      const key = formatIdentity(format);
      if (key) seenFormats.add(key);
    }
    if (variantKey) seenVariants.add(variantKey);
    added.push({ ...variant, formats: newFormats });
  }

  if (added.length === 0) return base;

  const variants = [...base.variants, ...added];
  const fileCount = variants.reduce((sum, variant) => sum + variant.formats.length, 0);
  return {
    ...base,
    country: {
      ...base.country,
      file_count: fileCount,
      design_count: variants.length,
    },
    variants,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug?.trim()) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    const [fromDb, fromBackend, diskVideos, r2Variants] = await Promise.all([
      loadFromDatabase(slug),
      fetchCountryGalleryFromBackendApi(slug),
      Promise.resolve(loadDiskVideosForCountry(slug)),
      loadFromR2(slug),
    ]);
    console.info(`[gallery/country] ${slug}: db=${fromDb?.variants.length ?? 0} backend=${fromBackend?.variants.length ?? 0} diskVideos=${diskVideos.length} r2=${r2Variants.length}`);

    if (fromDb && fromDb.variants.length > 0) {
      const extra = [...(fromBackend?.variants ?? []), ...diskVideos];
      const merged = mergeCountryGalleryPayload(fromDb, extra);
      return NextResponse.json(merged, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (fromBackend && fromBackend.variants.length > 0) {
      console.info(`[gallery/country] served ${slug} from backend API fallback`);
      const extra = [...diskVideos];
      const merged = mergeCountryGalleryPayload(fromBackend, extra);
      return NextResponse.json(merged, { headers: { 'Cache-Control': 'no-store' } });
    }

    const fromDisk = loadFromFlagStock(slug);
    if (fromDisk) {
      const extra = [...diskVideos, ...r2Variants];
      if (extra.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (fromDisk.variants as any[]).push(...extra);
      }
      return NextResponse.json(fromDisk);
    }

    if (r2Variants.length > 0) {
      const countryName = slugToCountryName(slug);
      const countryCode = getCountryCode(countryName);
      const webpCover = r2Variants.find((variant) =>
        variant.formats.some((format) => format.formatCode.toLowerCase() === 'webp'),
      )?.thumbnail || r2Variants.find((variant) => variant.thumbnail)?.thumbnail || null;
      return NextResponse.json({
        country: {
          name: countryName,
          slug,
          code: countryCode,
          region: null,
          description: buildCountryHubDescription({ name: countryName, slug, isoCode: countryCode, region: null, dbDescription: null, designCount: r2Variants.length, fileCount: r2Variants.length }),
          cover_image_url: webpCover,
          has_webp_cover: Boolean(webpCover?.toLowerCase().includes('.webp')),
          webp_cover_url: webpCover?.toLowerCase().includes('.webp') ? webpCover : null,
          file_count: r2Variants.length,
          design_count: r2Variants.length,
        },
        variants: [...r2Variants, ...diskVideos],
      });
    }

    const fallbackHub = emptyCountryHub(slug);
    if (canonicalCountryForSlug(slug)) {
      return NextResponse.json(fallbackHub, { headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json({ error: 'Country not found' }, { status: 404 });
  } catch (error) {
    console.error('Error loading country data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
