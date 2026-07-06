'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '../lib/auth/AuthContext';
import { CoreRoutePrefetch } from './CoreRoutePrefetch';
import { ToastContainer } from './Toast';

const SpinWheelPopup = dynamic(
  () => import('./SpinWheelPopup').then((mod) => mod.SpinWheelPopup),
  { ssr: false, loading: () => null }
);

/**
 * ClientProviders component
 * Wraps the app with all client-side providers (Auth, Theme, etc.)
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CoreRoutePrefetch />
      {children}
      <ToastContainer />
      <SpinWheelPopup />
    </AuthProvider>
  );
}
