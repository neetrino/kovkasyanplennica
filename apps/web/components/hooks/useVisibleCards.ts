'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for determining number of visible cards based on screen size
 * @returns Number of visible cards
 */
export function useVisibleCards() {
  const [visibleCards, setVisibleCards] = useState(4);

  useEffect(() => {
    const updateVisibleCards = () => {
      const width = window.innerWidth;
      // Home page menu-ի նման: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 (640/768/1024)
      if (width < 640) {
        setVisibleCards(1); // mobile (minVisibleCards 2 override on products)
      } else if (width < 768) {
        setVisibleCards(2); // sm
      } else if (width < 1024) {
        setVisibleCards(3); // md
      } else {
        setVisibleCards(4); // lg+
      }
    };

    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  return visibleCards;
}








