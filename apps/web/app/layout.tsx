import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
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
    <html lang="ru" className="h-full">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased min-h-full`}>
        <Suspense fallback={null}>
          <ClientProviders>
            <div className="flex min-h-screen flex-col pb-24 lg:pb-0 bg-[#2f3f3d] lg:bg-transparent">
              <div className="hidden lg:block">
                <Header />
                <Breadcrumb />
              </div>
              <div className="block lg:hidden">
                <MobileHeader />
              </div>
              <main className="flex-1 w-full">
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

