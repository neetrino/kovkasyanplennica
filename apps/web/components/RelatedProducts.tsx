'use client';

import { useEffect, useState } from 'react';
import type { LanguageCode } from '../lib/language';
import { t } from '../lib/i18n';
import type { RelatedProduct } from './hooks/useRelatedProducts';
import { useCarousel } from './hooks/useCarousel';
import { useVisibleCards } from './hooks/useVisibleCards';
import { ProductCard } from './ProductCard';
import { CarouselNavigation } from './RelatedProducts/CarouselNavigation';
import { CarouselDots } from './RelatedProducts/CarouselDots';

interface RelatedProductsProps {
  products: RelatedProduct[];
  loading: boolean;
  language: LanguageCode;
}

const MOBILE_BREAKPOINT = 768;

/**
 * Related products carousel — same `ProductCard` as products page (`ProductsCategoryCarousel`).
 */
export function RelatedProducts({ products, loading, language }: RelatedProductsProps) {
  /** Mobile (<640px): show 2 cards side by side (hook returns 1 below sm). */
  const visibleCards = Math.max(useVisibleCards(), 2);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
  } = useCarousel({ itemCount: products.length, visibleItems: visibleCards });

  const widthPercent = visibleCards > 0 ? 100 / visibleCards : 100;

  return (
    <section className="py-12 mt-20 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-[#FFE5C2] mb-10">
          {t(language, 'product.related_products_title')}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#FFE5C2] text-lg">{t(language, 'product.noRelatedProducts')}</p>
          </div>
        ) : (
          <div className="relative">
            {/* pt/pb: same as ProductsCategoryCarousel — overflow-hidden clips; image is -50% up, cart is +50% down */}
            <div
              ref={carouselRef}
              className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none pt-24 pb-14 sm:pt-28 sm:pb-16 md:pt-32 md:pb-20 lg:pt-36"
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
                  transition: isDragging ? 'none' : 'transform 0.5s ease-in-out',
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
                        id: product.id,
                        slug: product.slug,
                        title: product.title,
                        price: product.price,
                        image: product.image,
                        inStock: product.inStock,
                        defaultVariantId: product.defaultVariantId ?? null,
                        stock: product.stock,
                        brand: product.brand ?? null,
                        compareAtPrice: product.compareAtPrice ?? undefined,
                        originalPrice: product.originalPrice ?? undefined,
                        discountPercent: product.discountPercent ?? undefined,
                        category: product.categories?.[0]?.title,
                        labels: undefined,
                      }}
                      viewMode="grid-3"
                      compactHeight={isMobile}
                      largeCompactImage={isMobile}
                    />
                  </div>
                ))}
              </div>
            </div>

            {products.length > visibleCards && !isMobile && (
              <CarouselNavigation onPrevious={goToPrevious} onNext={goToNext} />
            )}

            {products.length > visibleCards && (
              <CarouselDots
                totalItems={products.length}
                visibleItems={visibleCards}
                currentIndex={currentIndex}
                onDotClick={goToIndex}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
