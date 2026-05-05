import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: 7,
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
              width: 3,
              height: 20,
              background: '#ffffff',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              width: 15,
              height: 10,
              marginLeft: 1,
              marginTop: 1,
              background: '#ffffff',
              borderTopRightRadius: 3,
              borderBottomRightRadius: 3,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
