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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function findWorldCountryPath(): string | null {
  for (const p of WORLD_COUNTRY_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function findCountryFolder(worldCountryPath: string, countrySlug: string): string | null {
  const norm = countrySlug.toLowerCase().replace(/-/g, ' ');
  try {
    const entries = fs.readdirSync(worldCountryPath);
    return entries.find((e) => e.toLowerCase() === norm) ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const file = searchParams.get('file');

    if (!country || !file) {
      return new NextResponse('Missing params', { status: 400 });
    }

    const safeCountry = path.basename(country);
    const safeFile = path.basename(file);
    if (safeCountry !== country || safeFile !== file || file.includes('..')) {
      return new NextResponse('Invalid params', { status: 403 });
    }

    const ext = path.extname(safeFile).toLowerCase();
    if (!ASSET_MIME[ext]) {
      return new NextResponse('Unsupported format', { status: 400 });
    }

    const worldCountryPath = findWorldCountryPath();
    if (!worldCountryPath) {
      return new NextResponse('Video storage not found', { status: 404 });
    }

    const countryFolder = findCountryFolder(worldCountryPath, safeCountry);
    if (!countryFolder) {
      return new NextResponse('Country not found', { status: 404 });
    }

    const countryDir = path.join(worldCountryPath, countryFolder);
    const candidates = [
      path.join(countryDir, safeFile),
      path.join(countryDir, 'free', safeFile),
    ];

    const resolvedBase = path.resolve(worldCountryPath);
    let videoPath: string | null = null;
    for (const candidate of candidates) {
      if (!path.resolve(candidate).startsWith(resolvedBase)) continue;
      if (fs.existsSync(candidate)) {
        videoPath = candidate;
        break;
      }
    }

    if (!videoPath) {
      return new NextResponse('Video not found', { status: 404 });
    }

    const stat = fs.statSync(videoPath);
    const totalSize = stat.size;
    const contentType = ASSET_MIME[ext] ?? 'application/octet-stream';
    const isVideo = ['.mp4', '.webm', '.mov'].includes(ext);

    const rangeHeader = isVideo ? request.headers.get('range') : null;
    if (rangeHeader) {
      const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;
        const chunkSize = end - start + 1;

        const buffer = Buffer.alloc(chunkSize);
        const fd = fs.openSync(videoPath, 'r');
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

    const videoBuffer = fs.readFileSync(videoPath);
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(totalSize),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[gallery/video]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
