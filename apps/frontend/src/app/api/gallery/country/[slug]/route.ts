import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCountryCode } from '@/lib/country-mapping';
import { getDb } from '@/lib/server/db';
import { buildCountryHubDescription } from '@/lib/gallery/country-hub-copy';
import { fetchCountryGalleryFromBackendApi } from '@/lib/server/gallery-country-detail-fallback';
import { fetchCountryGalleryFromDb } from '@/lib/server/gallery-from-db';
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
const ALL_FLAG_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.eps', '.ai', '.pdf', '.psd']);

async function loadFromR2(countrySlug: string) {
  const prefix = `flags/${countrySlug}/`;
  const r2Base = getPublicR2PublicBaseUrl();
  if (!r2Base) return [];

  let objects;
  try {
    objects = await listR2Objects(prefix, 500);
  } catch {
    return [];
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
      category: 'raster' | 'vector';
      file: string;
      url: string;
      previewUrl: string;
      premiumTier: 'free';
      downloadProtected: boolean;
      size: string;
      dimensions: string;
    }>;
  }> = [];

  for (const obj of objects) {
    const ext = path.extname(obj.key).toLowerCase();
    if (!ALL_FLAG_EXTS.has(ext)) continue;
    const filename = obj.key.split('/').pop() ?? obj.key;
    const fileId = `r2-${obj.key.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
    const extCode = ext.slice(1);
    const url = `${r2Base}/${obj.key}`;
    const isVector = ext === '.svg' || ext === '.eps' || ext === '.ai';
    const isPreviewable = PREVIEWABLE_EXTS.has(ext);
    variants.push({
      id: fileId,
      productSlug: fileId,
      name: filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      type: isVector ? 'vector' : 'standard',
      thumbnail: isPreviewable ? url : '',
      formats: [{
        id: `${fileId}-${extCode}`,
        format: extCode.toUpperCase(),
        formatCode: extCode,
        category: isVector ? 'vector' : 'raster',
        file: filename,
        url,
        previewUrl: isPreviewable ? url : '',
        premiumTier: 'free',
        downloadProtected: false,
        size: obj.size > 0 ? `${(obj.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
        dimensions: 'Original',
      }],
    });
  }

  return variants;
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

    const [fromDb, diskVideos, r2Variants] = await Promise.all([
      loadFromDatabase(slug),
      Promise.resolve(loadDiskVideosForCountry(slug)),
      loadFromR2(slug),
    ]);
    console.info(`[gallery/country] ${slug}: db=${fromDb?.variants.length ?? 0} diskVideos=${diskVideos.length} r2=${r2Variants.length}`);

    if (fromDb && fromDb.variants.length > 0) {
      const extra = [...diskVideos, ...r2Variants];
      const merged = extra.length > 0
        ? { ...fromDb, variants: [...fromDb.variants, ...extra] }
        : fromDb;
      return NextResponse.json(merged, { headers: { 'Cache-Control': 'no-store' } });
    }

    const fromBackend = await fetchCountryGalleryFromBackendApi(slug);
    if (fromBackend && fromBackend.variants.length > 0) {
      console.info(`[gallery/country] served ${slug} from backend API fallback`);
      const extra = [...diskVideos, ...r2Variants];
      const merged = extra.length > 0
        ? { ...fromBackend, variants: [...fromBackend.variants, ...extra] }
        : fromBackend;
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
      return NextResponse.json({
        country: {
          name: countryName,
          slug,
          code: countryCode,
          region: null,
          description: buildCountryHubDescription({ name: countryName, slug, isoCode: countryCode, region: null, dbDescription: null, designCount: r2Variants.length, fileCount: r2Variants.length }),
          cover_image_url: r2Variants[0]?.thumbnail ?? null,
          has_webp_cover: false,
          webp_cover_url: null,
          file_count: r2Variants.length,
          design_count: r2Variants.length,
        },
        variants: [...r2Variants, ...diskVideos],
      });
    }

    return NextResponse.json({ error: 'Country not found' }, { status: 404 });
  } catch (error) {
    console.error('Error loading country data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
