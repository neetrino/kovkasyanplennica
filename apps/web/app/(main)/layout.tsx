import { Suspense, type ReactNode } from 'react';
import { ClientProviders } from '@/components/ClientProviders';
import { Footer } from '@/components/Footer';
import { MainSiteChrome } from '@/components/MainSiteChrome';

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ClientProviders>
        <MainSiteChrome footerSlot={<Footer />}>{children}</MainSiteChrome>
      </ClientProviders>
    </Suspense>
  );
}
