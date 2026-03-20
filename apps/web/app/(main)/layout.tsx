import { Suspense, type ReactNode } from 'react';
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
        <div className="flex min-h-screen h-auto flex-col pb-24 lg:pb-0 bg-[#2f3f3d] lg:bg-transparent overflow-visible [transform:translateZ(0)] [backface-visibility:hidden]">
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
  );
}
