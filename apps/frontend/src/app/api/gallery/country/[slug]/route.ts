import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCountryCode } from '@/lib/country-mapping';
import { getDb } from '@/lib/server/db';
import { buildCountryHubDescription } from '@/lib/gallery/country-hub-copy';
import { fetchCountryGalleryFromBackendApi } from '@/lib/server/gallery-country-detail-fallback';
import { fetchCountryGalleryFromDb } from '@/lib/server/gallery-from-db';

export const dynamic = 'force-dynamic';

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

  const possiblePaths = [
    path.join(process.cwd(), '../../flag_stock'),
    path.join(process.cwd(), '../../../flag_stock'),
    'D:\\flagim\\iflag\\flag_stock',
    path.join(process.cwd(), 'flag_stock'),
    path.join(process.cwd(), '..', 'flag_stock'),
    path.join(process.cwd(), '..', '..', 'flag_stock'),
  ];

  let flagStockPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      flagStockPath = possiblePath;
      break;
    }
  }

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
      if (lowerFile.endsWith('.jpg') || lowerFile.endsWith('.jpeg')) {
        const fileCountryName = filenameToCountryName(file);
        const fileCountrySlug = countryToSlug(fileCountryName);

        if (
          fileCountrySlug === countrySlug ||
          fileCountryName.toLowerCase() === countryName.toLowerCase()
        ) {
          const fileId = file.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          const filePath = path.join(flagStockPath!, file);

          let fileSize = 'Unknown';
          let dimensions = 'Original';
          try {
            const stats = fs.statSync(filePath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            fileSize = `${sizeInMB} MB`;
          } catch {
            // ignore
          }

          const imageUrl = `/api/gallery/image?file=${encodeURIComponent(file)}`;
          variants.push({
            id: fileId,
            productSlug: fileId,
            name: 'Standard Flag',
            type: 'standard',
            thumbnail: imageUrl,
            formats: [
              {
                id: `${fileId}-jpg`,
                format: 'JPG',
                formatCode: 'jpg',
                category: 'raster',
                file: file,
                url: imageUrl,
                previewUrl: imageUrl,
                premiumTier: 'free',
                downloadProtected: false,
                size: fileSize,
                dimensions: dimensions,
              },
            ],
          });
        }
      }
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug?.trim()) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    const fromDb = await loadFromDatabase(slug);
    if (fromDb && fromDb.variants.length > 0) {
      return NextResponse.json(fromDb, { headers: { 'Cache-Control': 'no-store' } });
    }

    const fromBackend = await fetchCountryGalleryFromBackendApi(slug);
    if (fromBackend && fromBackend.variants.length > 0) {
      console.info(`[gallery/country] served ${slug} from backend API fallback`);
      return NextResponse.json(fromBackend, { headers: { 'Cache-Control': 'no-store' } });
    }

    const fromDisk = loadFromFlagStock(slug);
    if (fromDisk) {
      return NextResponse.json(fromDisk);
    }

    return NextResponse.json({ error: 'Country not found' }, { status: 404 });
  } catch (error) {
    console.error('Error loading country data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
