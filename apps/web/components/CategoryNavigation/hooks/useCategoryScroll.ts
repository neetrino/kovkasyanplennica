'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing category navigation scroll state.
 * Uses a callback ref so listeners are attached when the scroll container is mounted (e.g. when loading becomes false).
 */
export function useCategoryScroll() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [containerReady, setContainerReady] = useState(false);

  const setScrollContainerRef = useCallback((el: HTMLDivElement | null) => {
    scrollContainerRef.current = el;
    setContainerReady(!!el);
  }, []);

  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const canLeft = scrollLeft > 8;
    const canRight = scrollLeft + clientWidth < scrollWidth - 8;

    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
  }, []);

  useEffect(() => {
    if (!containerReady) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    let resizeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimeoutId !== null) clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(() => updateScrollButtons(), 100);
    };
    const handleScroll = () => updateScrollButtons();

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    const initTimeoutId = setTimeout(() => updateScrollButtons(), 100);

    return () => {
      if (resizeTimeoutId !== null) clearTimeout(resizeTimeoutId);
      clearTimeout(initTimeoutId);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [containerReady, updateScrollButtons]);

  const scrollByAmount = (amount: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(() => updateScrollButtons(), 100);
  };

  return {
    scrollContainerRef: setScrollContainerRef,
    canScrollLeft,
    canScrollRight,
    scrollByAmount,
    updateScrollButtons,
  };
}








