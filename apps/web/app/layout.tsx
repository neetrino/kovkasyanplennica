// app/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const SITE_DESCRIPTION =
  'В «Кавказской пленнице» вы окунётесь в атмосферу любимого фильма, насладитесь вкусной кухней и прекрасно проведёте время с семьёй или друзьями.';

function getMetadataBase(): URL {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  return new URL(raw.endsWith('/') ? raw.slice(0, -1) : raw);
}

export const metadata: Metadata = {
  title: 'Kovkasyan Plennica',
  description: SITE_DESCRIPTION,
  metadataBase: getMetadataBase(),
  openGraph: {
    title: 'Kovkasyan Plennica',
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kovkasyan Plennica',
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className="min-h-full">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased min-h-full`}>
        {children}
      </body>
    </html>
  );
}

