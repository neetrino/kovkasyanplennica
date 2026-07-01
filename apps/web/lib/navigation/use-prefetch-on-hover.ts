'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';

/**
 * Prefetches a route once on hover/focus — avoids mass prefetch on product grids.
 */
export function usePrefetchOnHover() {
  const router = useRouter();
  const prefetchedRef = useRef<Set<string>>(new Set());

  return useCallback(
    (href: string) => {
      if (!href || prefetchedRef.current.has(href)) {
        return;
      }
      prefetchedRef.current.add(href);
      void router.prefetch(href);
    },
    [router],
  );
}
