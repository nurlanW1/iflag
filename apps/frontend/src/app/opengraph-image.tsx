import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/seo/site-config';

export const runtime = 'edge';

export const alt = `${SITE_NAME} — Flag marketplace`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #00363f 0%, #009ab6 50%, #001a1f 100%)',
          color: '#fff',
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: '-0.04em',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 48 }}>
          <span>{SITE_NAME}</span>
          <span style={{ fontSize: 28, fontWeight: 500, opacity: 0.92 }}>Flag marketplace</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
