'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { t } from '@/lib/i18n';
import { ProductReviews } from '@/components/ProductReviews';
import { RelatedProducts } from '@/components/RelatedProducts';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductInfoAndActions } from './ProductInfoAndActions';
import { useProductPage } from './useProductPage';
import type { Product } from './types';
import type { ProductPageProps } from './types';
import type { RelatedProduct } from '@/components/hooks/useRelatedProducts';
import type { Review } from '@/components/ProductReviews/utils';

interface ProductPageClientProps extends ProductPageProps {
  initialProduct: Product;
  initialReviews: Review[];
  initialRelatedProducts: RelatedProduct[];
}

export function ProductPageClient({
  params,
  initialProduct,
  initialReviews,
  initialRelatedProducts,
}: ProductPageClientProps) {
  const { isLoggedIn } = useAuth();

  const {
    product,
    loading,
    reviews,
    reviewsLoading,
    setReviews,
    images,
    currentImageIndex,
    setCurrentImageIndex,
    thumbnailStartIndex,
    setThumbnailStartIndex,
    currency,
    language,
    selectedColor,
    selectedSize,
    selectedAttributeValues,
    showMessage,
    isInWishlist,
    isInCompare,
    quantity,
    averageRating,
    slug,
    relatedProducts,
    relatedLoading,
    attributeGroups,
    colorGroups,
    sizeGroups,
    currentVariant,
    price,
    originalPrice,
    compareAtPrice,
    discountPercent,
    maxQuantity,
    isOutOfStock,
    isVariationRequired,
    hasUnavailableAttributes,
    unavailableAttributes,
    canAddToCart,
    scrollToReviews,
    getOptionValue,
    adjustQuantity,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
    handleAddToWishlist,
    handleCompareToggle,
    getRequiredAttributesMessage,
  } = useProductPage({
    params,
    initialProduct,
    initialReviews,
    initialRelatedProducts,
  });

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        {t(language, 'common.messages.loading')}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-start">
        <ProductImageGallery
          images={images}
          product={product}
          discountPercent={discountPercent}
          language={language}
          currentImageIndex={currentImageIndex}
          onImageIndexChange={setCurrentImageIndex}
          thumbnailStartIndex={thumbnailStartIndex}
          onThumbnailStartIndexChange={setThumbnailStartIndex}
        />

        <ProductInfoAndActions
          product={product}
          price={price}
          originalPrice={originalPrice}
          compareAtPrice={compareAtPrice}
          discountPercent={discountPercent}
          currency={currency}
          language={language}
          averageRating={averageRating}
          reviewsCount={reviews.length}
          quantity={quantity}
          maxQuantity={maxQuantity}
          isOutOfStock={isOutOfStock}
          isVariationRequired={isVariationRequired}
          hasUnavailableAttributes={hasUnavailableAttributes}
          unavailableAttributes={unavailableAttributes}
          canAddToCart={canAddToCart}
          isInWishlist={isInWishlist}
          isInCompare={isInCompare}
          showMessage={showMessage}
          isLoggedIn={isLoggedIn}
          currentVariant={currentVariant}
          attributeGroups={attributeGroups}
          selectedColor={selectedColor}
          selectedSize={selectedSize}
          selectedAttributeValues={selectedAttributeValues}
          colorGroups={colorGroups}
          sizeGroups={sizeGroups}
          onQuantityAdjust={adjustQuantity}
          onAddToWishlist={handleAddToWishlist}
          onCompareToggle={handleCompareToggle}
          onScrollToReviews={scrollToReviews}
          onColorSelect={handleColorSelect}
          onSizeSelect={handleSizeSelect}
          onAttributeValueSelect={handleAttributeValueSelect}
          getOptionValue={getOptionValue}
          getRequiredAttributesMessage={getRequiredAttributesMessage}
        />
      </div>

      <div id="product-reviews" className="mt-24 scroll-mt-24">
        <ProductReviews
          productSlug={slug}
          productId={product.id}
          reviews={reviews}
          setReviews={setReviews}
          loading={reviewsLoading}
        />
      </div>
      <div className="mt-16">
        <RelatedProducts products={relatedProducts} loading={relatedLoading} language={language} />
      </div>
    </div>
  );
}
