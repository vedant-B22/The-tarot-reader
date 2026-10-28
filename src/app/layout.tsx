import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Tarot Reader – Live Event Manager | SSPU Halloween 2026',
  description: 'Live queue, service selection, and real-time token tracking for the SSPU Halloween Tarot Stall.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tarot Stall',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#080410',
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
