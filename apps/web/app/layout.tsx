// app/layout.tsx
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Մետատվյալները կարող եք ավելացնել այստեղ
export const metadata = {
  title: 'Kovkasyan Plennica',
  description: 'Shop description',
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

