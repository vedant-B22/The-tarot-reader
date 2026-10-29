import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Tarot Reader • Clarity Through The Cards | Vedant Baviskar',
  description: 'Intuitive personal tarot readings, curated spreads, and daily guidance with Vedant Baviskar (@the_arcane_diaries). Book 1-on-1 sessions online or connect directly on WhatsApp.',
  keywords: ['Tarot Reading', 'Vedant Baviskar', 'The Arcane Diaries', 'Tarot Pune', 'SSPU Tarot', 'Card of the Day', 'Astrology Guidance', 'Love Tarot Reading'],
  authors: [{ name: 'Vedant Baviskar' }],
  metadataBase: new URL('https://tarot-reader-sspu.vercel.app'),
  openGraph: {
    title: 'The Tarot Reader • Clarity Through The Cards',
    description: 'Personal intuitive tarot readings with Vedant Baviskar (@the_arcane_diaries). Draw your free Card of the Day and book 1-on-1 guidance.',
    url: 'https://tarot-reader-sspu.vercel.app',
    siteName: 'The Tarot Reader',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Tarot Reader • Clarity Through The Cards',
    description: 'Personal intuitive tarot readings with Vedant Baviskar (@the_arcane_diaries).',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'The Tarot Reader',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#070210',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="mystical-bg text-gray-100 antialiased min-h-screen flex flex-col selection:bg-purple-900 selection:text-amber-200">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
