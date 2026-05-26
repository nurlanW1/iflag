import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/seo/site-config';

export const runtime = 'edge';

const SIZE = { width: 1200, height: 630 };

/**
 * Social / search preview image with watermark for premium flag designs.
 * Query: src (absolute preview URL), title (optional label).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get('src')?.trim();
  if (!src || !/^https?:\/\//i.test(src)) {
    return new Response('Invalid or missing src', { status: 400 });
  }

  const label = searchParams.get('title')?.trim() || SITE_NAME;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f1f5f9',
          position: 'relative',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- OG builder remote asset */}
        <img
          src={src}
          alt=""
          style={{
            width: '88%',
            height: '78%',
            objectFit: 'contain',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 96,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.42)',
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
            transform: 'rotate(-18deg)',
            textShadow: '0 4px 32px rgba(15,23,42,0.35)',
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            right: 36,
            fontSize: 22,
            fontWeight: 600,
            color: '#475569',
            maxWidth: '70%',
            textAlign: 'right',
          }}
        >
          {label}
        </div>
      </div>
    ),
    SIZE,
  );
}
