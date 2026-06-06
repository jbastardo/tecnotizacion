import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563eb',
          borderRadius: 80,
        }}
      >
        <div style={{ fontSize: 220, fontWeight: 'bold', color: 'white', lineHeight: 1 }}>T</div>
        <div style={{ fontSize: 64, color: '#93c5fd', fontWeight: 600, marginTop: -20 }}>TECNO</div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
