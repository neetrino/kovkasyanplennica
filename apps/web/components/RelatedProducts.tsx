'use client';

import { useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { getStoredCurrency } from '../lib/currency';
import type { LanguageCode } from '../lib/language';
import { t } from '../lib/i18n';
import { mergeGuestCartLine } from '@/lib/guest-cart/mergeGuestCartLine';
import type { RelatedProduct } from './hooks/useRelatedProducts';
import { useCarousel } from './hooks/useCarousel';
import { useVisibleCards } from './hooks/useVisibleCards';
import { RelatedProductCard } from './RelatedProducts/RelatedProductCard';
import { CarouselNavigation } from './RelatedProducts/CarouselNavigation';
import { CarouselDots } from './RelatedProducts/CarouselDots';

interface RelatedProductsProps {
  products: RelatedProduct[];
  loading: boolean;
  language: LanguageCode;
}

/**
 * Related products carousel — data is fetched in `useProductPage` (parallel with product + reviews).
 */
export function RelatedProducts({ products, loading, language }: RelatedProductsProps) {
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const visibleCards = useVisibleCards();

  const {
    currentIndex,
    isDragging,
    hasMoved,
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

  const handleAddToCart = async (e: MouseEvent, product: RelatedProduct) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.inStock) {
      return;
    }

    setAddingToCart((prev) => new Set(prev).add(product.id));

    try {
      interface ProductDetails {
        id: string;
        slug: string;
        variants?: Array<{
          id: string;
          sku: string;
          price: number;
          stock: number;
          available: boolean;
          compareAtPrice?: number | null;
        }>;
      }

      const encodedSlug = encodeURIComponent(product.slug.trim());
      const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);

      if (!productDetails.variants || productDetails.variants.length === 0) {
        alert('No variants available');
        return;
      }

      const variant = productDetails.variants[0];
      mergeGuestCartLine({
        productId: product.id,
        variantId: variant.id,
        productSlug: productDetails.slug || product.slug.trim(),
        addQuantity: 1,
        title: product.title,
        image: product.image,
        price: variant.price,
        originalPrice: variant.compareAtPrice ?? product.originalPrice ?? product.compareAtPrice ?? null,
        sku: variant.sku,
        stock: variant.stock,
      });

      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        router.push(`/login?redirect=/products/${product.slug}`);
      } else {
        alert('Failed to add product to cart. Please try again.');
      }
    } finally {
      setAddingToCart((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const currency = getStoredCurrency();
  const handleImageError = (productId: string) => {
    setImageErrors((prev) => new Set(prev).add(productId));
  };

  return (
    <section className="py-12 mt-20 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">
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
            <p className="text-gray-500 text-lg">{t(language, 'product.noRelatedProducts')}</p>
          </div>
        ) : (
          <div className="relative">
            <div
              ref={carouselRef}
              className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
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
                  transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
                  transition: isDragging ? 'none' : 'transform 0.5s ease-in-out',
                }}
              >
                {products.map((product) => (
                  <RelatedProductCard
                    key={product.id}
                    product={product}
                    currency={currency}
                    language={language}
                    isAddingToCart={addingToCart.has(product.id)}
                    hasMoved={hasMoved}
                    onAddToCart={handleAddToCart}
                    onImageError={handleImageError}
                    imageError={imageErrors.has(product.id)}
                    width={`${100 / visibleCards}%`}
                  />
                ))}
              </div>
            </div>

            {products.length > visibleCards && (
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
