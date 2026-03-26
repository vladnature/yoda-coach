import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yoda Coach — Accountability AI',
  description: 'Direct, no-fluff accountability coaching for Vlad. 100 EasyTask signups by April 30.',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Yoda Coach',
  },
  openGraph: {
    title: 'Yoda Coach',
    description: 'Accountability AI for building in public',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
