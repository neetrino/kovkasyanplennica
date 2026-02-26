import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MobileBottomNav } from '../components/mobileHomePage/MobileBottomNav';
import { MobileHeader } from '../components/mobileHomePage/MobileHeader';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Shop - Professional E-commerce',
  description: 'Modern e-commerce platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="min-h-full">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased min-h-full`}>
        <Suspense fallback={null}>
          <ClientProviders>
            <div className="flex min-h-screen h-auto flex-col pb-24 lg:pb-0 bg-[#2f3f3d] lg:bg-transparent overflow-visible">
              <div className="hidden lg:block">
                <Header />
              </div>
              <div className="block lg:hidden">
                <MobileHeader />
              </div>
              <main className="w-full flex-1 min-h-0 overflow-visible">
                {children}
              </main>
              <div className="hidden lg:block">
                <Footer />
              </div>
              <div className="block lg:hidden">
                <MobileBottomNav />
              </div>
            </div>
          </ClientProviders>
        </Suspense>
      </body>
    </html>
  );
}

