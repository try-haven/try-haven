import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Haven — Apartment Swiping App';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#6366f1',
          position: 'relative',
        }}
      >
        {/* Haven Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          {/* Circular background with house icon */}
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              backgroundColor: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* House icon representation */}
            <div
              style={{
                fontSize: 100,
                color: 'white',
                display: 'flex',
              }}
            >
              🏠
            </div>
            {/* Pin overlay */}
            <div
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: '#4c1d95',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
              }}
            >
              📍
            </div>
          </div>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 20,
          }}
        >
          Haven
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Find your perfect apartment by swiping through verified listings
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
