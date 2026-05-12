import { NextResponse } from 'next/server';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

function resolveCountryFlagIconsDir(): string | null {
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'country-flag-icons'),
    path.join(process.cwd(), '..', 'node_modules', 'country-flag-icons'),
    path.join(process.cwd(), '..', '..', 'node_modules', 'country-flag-icons'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
  }
  try {
    const require = createRequire(import.meta.url);
    return path.dirname(require.resolve('country-flag-icons/package.json'));
  } catch {
    return null;
  }
}

/**
 * Landing / marketing previews: serves a small **PNG** (via flagcdn) same-origin, or falls back to
 * bundled **SVG** from `country-flag-icons` when the fetch fails (offline, block, rare code).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('code')?.trim().toLowerCase() ?? '';
  const code = raw === 'uk' ? 'gb' : raw;
  if (!/^[a-z]{2}$/.test(code)) {
    return new NextResponse('Invalid code', { status: 400 });
  }

  const pngUrl = `https://flagcdn.com/w320/${code}.png`;

  try {
    const pngRes = await fetch(pngUrl, { next: { revalidate: 86_400 } });
    if (pngRes.ok) {
      const buf = Buffer.from(await pngRes.arrayBuffer());
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  } catch {
    /* fall through to SVG */
  }

  const pkgDir = resolveCountryFlagIconsDir();
  if (pkgDir) {
    const upper = code.toUpperCase();
    const svgPath = path.join(pkgDir, '3x2', `${upper}.svg`);
    if (fs.existsSync(svgPath)) {
      const svg = fs.readFileSync(svgPath);
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  }

  return new NextResponse('Not found', { status: 404 });
}
