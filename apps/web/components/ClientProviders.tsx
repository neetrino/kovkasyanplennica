'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth/AuthContext';
import { CoreRoutePrefetch } from './CoreRoutePrefetch';
import { ToastContainer } from './Toast';

const SpinWheelPopup = dynamic(
  () => import('./SpinWheelPopup').then((mod) => mod.SpinWheelPopup),
  {
    ssr: false,
    loading: () => null,
  }
);

/**
 * ClientProviders component
 * Wraps the app with all client-side providers (Auth, Theme, etc.)
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldRenderSpinWheel = pathname === '/';

  return (
    <AuthProvider>
      <CoreRoutePrefetch />
      {children}
      <ToastContainer />
      {shouldRenderSpinWheel ? <SpinWheelPopup /> : null}
    </AuthProvider>
  );
}
