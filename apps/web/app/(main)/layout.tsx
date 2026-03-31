import { Suspense, type ReactNode } from 'react';
import { APP_SCROLL_REGION_DOM_ID } from '@/lib/appScrollRegion';
import { ClientProviders } from '@/components/ClientProviders';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/mobileHomePage/MobileBottomNav';
import { MobileHeader } from '@/components/mobileHomePage/MobileHeader';

/** Avoid static prerender so client hooks (useContext) do not run in build workers. */
export const dynamic = 'force-dynamic';

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
          className="relative flex h-dvh min-h-0 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#2f3f3d] lg:bg-transparent pb-24 lg:pb-0"
        >
          <div className="relative z-[60] hidden min-h-[106px] shrink-0 lg:block">
            <Header />
          </div>
          <div className="relative z-[60] block shrink-0 lg:hidden">
            <MobileHeader />
          </div>
          <div className="relative z-30 flex w-full flex-1 flex-col">
            <main className="w-full flex-1">{children}</main>
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
