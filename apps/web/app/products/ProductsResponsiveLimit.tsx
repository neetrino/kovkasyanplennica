'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/** 3 rows per page: mobile 2x3=6, tablet 3x3=9, desktop 4x3=12 */
const LIMIT_MOBILE = 6;
const LIMIT_TABLET = 9;
const LIMIT_DESKTOP = 12;

function getLimitForWidth(width: number): number {
  if (width < 768) return LIMIT_MOBILE;
  if (width < 1024) return LIMIT_TABLET;
  return LIMIT_DESKTOP;
}

/**
 * Syncs URL ?limit= with viewport so each page shows 3 rows (6/9/12 products).
 * Runs after mount and on resize; only updates URL when limit differs.
 */
export function ProductsResponsiveLimit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const desired = getLimitForWidth(window.innerWidth);
    const current = searchParams.get('limit');
    const currentNum = current ? parseInt(current, 10) : LIMIT_DESKTOP;
    if (currentNum === desired) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set('limit', String(desired));
    next.set('page', '1');
    router.replace(`/products?${next.toString()}`, { scroll: false });
  }, [mounted, searchParams, router]);

  useEffect(() => {
    if (!mounted) return;
    const onResize = () => {
      const desired = getLimitForWidth(window.innerWidth);
      const params = new URLSearchParams(window.location.search);
      const current = params.get('limit');
      const currentNum = current ? parseInt(current, 10) : LIMIT_DESKTOP;
      if (currentNum === desired) return;
      params.set('limit', String(desired));
      params.set('page', '1');
      router.replace(`/products?${params.toString()}`, { scroll: false });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mounted, router]);

  return null;
}
