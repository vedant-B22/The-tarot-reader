import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
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
          backgroundColor: '#070210',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #20083c 0%, #070210 100%)',
          color: '#ffffff',
          padding: '60px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            border: '2px solid rgba(251, 191, 36, 0.6)',
            background: 'rgba(251, 191, 36, 0.1)',
            marginBottom: '24px',
            fontSize: '44px',
          }}
        >
          🌙
        </div>

        <div
          style={{
            fontSize: '20px',
            letterSpacing: '6px',
            color: '#fbbf24',
            textTransform: 'uppercase',
            marginBottom: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 700,
          }}
        >
          The Arcane Diaries
        </div>

        <div
          style={{
            fontSize: '64px',
            fontWeight: 900,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}
        >
          The Tarot Reader
        </div>

        <div
          style={{
            fontSize: '28px',
            fontStyle: 'italic',
            color: 'rgba(216, 180, 254, 0.9)',
            marginBottom: '36px',
          }}
        >
          &ldquo;Clarity through the cards&rdquo;
        </div>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            fontSize: '18px',
            fontFamily: 'sans-serif',
            color: 'rgba(251, 191, 36, 0.9)',
            borderTop: '1px solid rgba(147, 51, 234, 0.4)',
            paddingTop: '24px',
          }}
        >
          <span>Personal 1-on-1 Readings</span>
          <span>•</span>
          <span>Free Daily Card</span>
          <span>•</span>
          <span>@this.is_vedant_12</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
