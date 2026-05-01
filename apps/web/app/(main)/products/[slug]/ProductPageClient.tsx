'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { t, getProductText } from '@/lib/i18n';
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
  initialReviews?: Review[];
  initialRelatedProducts?: RelatedProduct[];
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
    currency,
    language,
    selectedColor,
    selectedSize,
    selectedAttributeValues,
    quantity,
    setQuantity,
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
    getOptionValue,
    adjustQuantity,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
    getRequiredAttributesMessage,
  } = useProductPage({
    params,
    initialProduct,
    initialReviews,
    initialRelatedProducts,
  });

  if (loading || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 pt-4 text-center sm:pt-6 lg:pt-[88px] xl:pt-[112px]">
        {t(language, 'common.messages.loading')}
      </div>
    );
  }

  const longDescriptionHtml =
    getProductText(language, product.id, 'longDescription') || product.description || '';

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-[76px]">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,min(100%,494px))_minmax(0,1fr)] lg:gap-[42px]">
        <ProductImageGallery
          images={images}
          product={product}
          discountPercent={discountPercent}
          language={language}
          currentImageIndex={currentImageIndex}
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
          quantity={quantity}
          maxQuantity={maxQuantity}
          isOutOfStock={isOutOfStock}
          isVariationRequired={isVariationRequired}
          hasUnavailableAttributes={hasUnavailableAttributes}
          unavailableAttributes={unavailableAttributes}
          canAddToCart={canAddToCart}
          isLoggedIn={isLoggedIn}
          currentVariant={currentVariant}
          attributeGroups={attributeGroups}
          selectedColor={selectedColor}
          selectedSize={selectedSize}
          selectedAttributeValues={selectedAttributeValues}
          colorGroups={colorGroups}
          sizeGroups={sizeGroups}
          onQuantityAdjust={adjustQuantity}
          onResetQuantity={() => setQuantity(1)}
          onColorSelect={handleColorSelect}
          onSizeSelect={handleSizeSelect}
          onAttributeValueSelect={handleAttributeValueSelect}
          getOptionValue={getOptionValue}
          getRequiredAttributesMessage={getRequiredAttributesMessage}
        />
      </div>

      {longDescriptionHtml.trim() ? (
        <div
          className="prose prose-invert prose-p:leading-relaxed mx-auto mt-16 max-w-3xl text-[#ececec] prose-headings:text-[#fff4de] prose-a:text-[#ffe5c2] sm:prose-base"
          dangerouslySetInnerHTML={{ __html: longDescriptionHtml }}
        />
      ) : null}

      <div className="mt-20 lg:mt-24">
        <RelatedProducts products={relatedProducts} loading={relatedLoading} language={language} />
      </div>
      <div id="product-reviews" className="mt-16 scroll-mt-24">
        <ProductReviews
          productSlug={slug}
          productId={product.id}
          reviews={reviews}
          setReviews={setReviews}
          loading={reviewsLoading}
        />
      </div>
    </div>
  );
}
