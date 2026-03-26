import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kodo — Accountability Coach',
  description: 'Your direct, no-fluff accountability coach.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
