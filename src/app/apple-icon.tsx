import { ImageResponse } from 'next/og';

// Removed edge runtime to allow static generation and fix Vercel warning
export const size = { width: 180, height: 180 };
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: 'white',
          fontSize: 84,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        CN
      </div>
    ),
    { ...size }
  );
}
