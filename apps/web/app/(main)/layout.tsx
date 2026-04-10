import { Suspense, type ReactNode } from 'react';
import { APP_SCROLL_REGION_DOM_ID } from '@/lib/appScrollRegion';
import { ClientProviders } from '@/components/ClientProviders';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/mobileHomePage/MobileBottomNav';
import { MobileHeader } from '@/components/mobileHomePage/MobileHeader';

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ClientProviders>
        <div
          id={APP_SCROLL_REGION_DOM_ID}
          data-app-scroll-region
          className="relative flex h-dvh min-h-0 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#2f3f3d] pb-[172px] lg:pb-0"
        >
          {/* Solid bg: fixed header spacer must not reveal body (gray-50) while scrolling */}
          <div className="relative z-app-header hidden min-h-[104px] shrink-0 bg-[#2f3f3d] xl:block">
            <Header />
          </div>
          <div className="relative z-app-header block shrink-0 xl:hidden">
            <MobileHeader />
          </div>
          {/* No z-index here: fixed popups inside `main` must stack above `.z-app-header` (see globals.css). */}
          <div className="relative flex w-full flex-1 flex-col max-lg:flex-none max-lg:min-h-0">
            <main className="w-full flex-1 max-lg:flex-none">{children}</main>
            <div className="mt-auto hidden shrink-0 lg:block">
              <Footer />
            </div>
          </div>
          <div className="relative z-40 block shrink-0 lg:hidden">
            <MobileBottomNav />
          </div>
        </div>
      </ClientProviders>
    </Suspense>
  );
}
