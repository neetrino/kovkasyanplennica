// app/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { getRootSiteMetadata } from '@/lib/site-metadata';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

function getMetadataBase(): URL {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  return new URL(raw.endsWith('/') ? raw.slice(0, -1) : raw);
}

export const metadata: Metadata = getRootSiteMetadata(getMetadataBase());

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className="min-h-full">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased min-h-full`}>
        {children}
      </body>
    </html>
  );
}

