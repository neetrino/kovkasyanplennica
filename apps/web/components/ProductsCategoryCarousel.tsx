'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { useCarousel } from './hooks/useCarousel';
import { useVisibleCards } from './hooks/useVisibleCards';
import { useTranslation } from '../lib/i18n-client';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  inStock: boolean;
  brand: { id: string; name: string } | null;
  category?: string;
}

interface ProductsCategoryCarouselProps {
  products: Product[];
  sortBy?: string;
  /** Mobile: show at least this many cards (e.g. 2) so user can scroll category with 2 visible */
  minVisibleCards?: number;
}

/**
 * Horizontal carousel of products for one category row on the products page
 */
const MOBILE_BREAKPOINT = 768;

export function ProductsCategoryCarousel({ products: rawProducts, sortBy = 'default', minVisibleCards }: ProductsCategoryCarouselProps) {
  const { t } = useTranslation();
  const visibleFromHook = useVisibleCards();
  const visibleCards = minVisibleCards != null ? Math.max(visibleFromHook, minVisibleCards) : visibleFromHook;
  const [products, setProducts] = useState<Product[]>(rawProducts);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    let sorted = [...rawProducts];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
    setProducts(sorted);
  }, [rawProducts, sortBy]);

  const {
    currentIndex,
    isDragging,
    carouselRef,
    goToPrevious,
    goToNext,
    goToIndex,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  } = useCarousel({
    itemCount: products.length,
    visibleItems: visibleCards,
    autoRotateInterval: 999999999,
  });

  const widthPercent = visibleCards > 0 ? 100 / visibleCards : 100;
  const showNav = products.length > visibleCards;

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('products.grid.noProducts')}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Carousel: քարտերի քանակն ու gap — home page menu-ի նման (grid-cols-2 md:3 lg:4, gap-6 md:gap-8) */}
      <div
        ref={carouselRef}
        className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none pt-14 pb-8 sm:pt-16 sm:pb-16 md:pt-20 md:pb-20"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div
          className="flex items-stretch"
          style={{
            transform: `translateX(-${currentIndex * widthPercent}%)`,
            transition: isDragging ? 'none' : 'transform 0.4s ease-in-out',
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 px-3 md:px-4"
              style={{ width: `${widthPercent}%` }}
            >
              <ProductCard
                product={{
                  ...product,
                  compareAtPrice: product.compareAtPrice ?? undefined,
                  labels: undefined,
                }}
                viewMode="grid-3"
                compactHeight={isMobile}
              />
            </div>
          ))}
        </div>
      </div>

      {showNav && (
        <div>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#2F3F3D] shadow-lg flex items-center justify-center transition-all hover:scale-110"
            aria-label={t('products.carousel.previous')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#2F3F3D] shadow-lg flex items-center justify-center transition-all hover:scale-110"
            aria-label={t('products.carousel.next')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {showNav && products.length > visibleCards && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.ceil(products.length / visibleCards) }).map((_, index) => {
            const startIndex = index * visibleCards;
            const isActive = currentIndex >= startIndex && currentIndex < startIndex + visibleCards;
            return (
              <button
                key={index}
                type="button"
                onClick={() => goToIndex(startIndex)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60 w-2'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
