import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#009ab6',
          borderRadius: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 14,
              height: 96,
              background: '#ffffff',
              borderRadius: 8,
            }}
          />
          <div
            style={{
              width: 72,
              height: 52,
              marginLeft: 6,
              marginTop: 6,
              background: '#ffffff',
              borderTopRightRadius: 14,
              borderBottomRightRadius: 14,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
