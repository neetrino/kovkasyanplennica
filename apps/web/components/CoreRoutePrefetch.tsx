'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CORE_ROUTES = ['/', '/products', '/about'] as const;

export function CoreRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    const prefetchRoutes = () => {
      for (const route of CORE_ROUTES) {
        router.prefetch(route);
      }
    };

    const idleWindow = window as Window &
      Partial<{
        requestIdleCallback: (callback: IdleRequestCallback) => number;
        cancelIdleCallback: (handle: number) => void;
      }>;

    if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(() => prefetchRoutes());
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetchRoutes, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [router]);

  return null;
}
