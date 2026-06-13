/**
 * Serves flag video/image assets from the local world_country disk directory.
 * URL: /api/gallery/video/[country-slug]/[filename.ext]
 * Example: /api/gallery/video/algeria/Algeria_flag_waves_flagpole.mp4
 *
 * Supports HTTP range requests so browsers can seek through videos.
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const WORLD_COUNTRY_PATHS = [
  'D:\\flagim\\Country\\world_country',
  path.join(process.cwd(), '..', '..', 'Country', 'world_country'),
  path.join(process.cwd(), '..', 'Country', 'world_country'),
  path.join(process.cwd(), '..', '..', '..', 'Country', 'world_country'),
];

const ASSET_MIME: Record<string, string> = {
  mp4:  'video/mp4',
  webm: 'video/webm',
  mov:  'video/quicktime',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  svg:  'image/svg+xml',
  webp: 'image/webp',
};

function findWorldCountryPath(): string | null {
  for (const p of WORLD_COUNTRY_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function findCountryFolder(worldCountryPath: string, slug: string): string | null {
  const norm = slug.toLowerCase().replace(/-/g, ' ');
  try {
    return fs.readdirSync(worldCountryPath).find((e) => e.toLowerCase() === norm) ?? null;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ country: string; file: string }> },
) {
  try {
    const { country, file } = await context.params;

    const safeCountry = path.basename(country);
    const safeFile = path.basename(file);
    if (!safeFile || safeFile !== file || file.includes('..')) {
      return new NextResponse('Invalid params', { status: 403 });
    }

    const ext = path.extname(safeFile).toLowerCase().slice(1);
    const contentType = ASSET_MIME[ext];
    if (!contentType) return new NextResponse('Unsupported format', { status: 400 });

    const worldCountryPath = findWorldCountryPath();
    if (!worldCountryPath) return new NextResponse('Storage not found', { status: 404 });

    const countryFolder = findCountryFolder(worldCountryPath, safeCountry);
    if (!countryFolder) return new NextResponse('Country not found', { status: 404 });

    const countryDir = path.join(worldCountryPath, countryFolder);
    const resolvedBase = path.resolve(worldCountryPath);
    const candidates = [
      path.join(countryDir, safeFile),
      path.join(countryDir, 'free', safeFile),
    ];

    let filePath: string | null = null;
    for (const c of candidates) {
      if (!path.resolve(c).startsWith(resolvedBase)) continue;
      if (fs.existsSync(c)) { filePath = c; break; }
    }
    if (!filePath) return new NextResponse('File not found', { status: 404 });

    const stat = fs.statSync(filePath);
    const totalSize = stat.size;
    const isVideo = ['mp4', 'webm', 'mov'].includes(ext);

    const rangeHeader = isVideo ? request.headers.get('range') : null;
    if (rangeHeader) {
      const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? Math.min(parseInt(match[2], 10), totalSize - 1) : totalSize - 1;
        const chunkSize = end - start + 1;
        const buffer = Buffer.alloc(chunkSize);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, chunkSize, start);
        fs.closeSync(fd);
        return new NextResponse(buffer, {
          status: 206,
          headers: {
            'Content-Type': contentType,
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }

    const buf = fs.readFileSync(filePath);
    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(totalSize),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[gallery/video]', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
