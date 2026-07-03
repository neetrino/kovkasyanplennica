import { Suspense, type ReactNode } from 'react';
import { ClientProviders } from '@/components/ClientProviders';
import { MainSiteChrome } from '@/components/MainSiteChrome';

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ClientProviders>
        <MainSiteChrome>{children}</MainSiteChrome>
      </ClientProviders>
    </Suspense>
  );
}
