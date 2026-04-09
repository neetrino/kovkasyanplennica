import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { CurrencyCode } from '@/lib/currency';
import { cleanImageUrls, separateMainAndVariantImages } from '@/lib/utils/image-utils';
import type { ProductData, ColorData, Variant } from '../types';
import { useTranslation } from '@/lib/i18n-client';
import { extractColor, extractSize } from '../utils/variantAttributeExtraction';
import {
  createDefaultColorData,
  updateDefaultColorData,
  createColorData,
  updateColorData,
} from '../utils/colorDataBuilder';
import {
  collectVariantImagesFromColors,
  collectVariantImagesFromProductVariants,
} from '../utils/variantImageCollector';
import { hasVariantsWithAttributes } from '../utils/productTypeDetector';
import { buildFormData } from '../utils/productFormDataBuilder';

interface UseProductEditModeProps {
  productId: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  attributes: any[];
  defaultCurrency: CurrencyCode;
  setLoadingProduct: (loading: boolean) => void;
  setFormData: (updater: (prev: any) => any) => void;
  setUseNewBrand: (use: boolean) => void;
  setUseNewCategory: (use: boolean) => void;
  setNewBrandName: (name: string) => void;
  setNewCategoryName: (name: string) => void;
  setHasVariantsToLoad: (has: boolean) => void;
  setProductType: (type: 'simple' | 'variable') => void;
  setSimpleProductData: (data: any) => void;
}

export function useProductEditMode({
  productId,
  isLoggedIn,
  isAdmin,
  attributes,
  defaultCurrency,
  setLoadingProduct,
  setFormData,
  setUseNewBrand,
  setUseNewCategory,
  setNewBrandName,
  setNewCategoryName,
  setHasVariantsToLoad,
  setProductType,
  setSimpleProductData,
}: UseProductEditModeProps) {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (productId && isLoggedIn && isAdmin) {
      const loadProduct = async () => {
        try {
          setLoadingProduct(true);
          console.log('📥 [ADMIN] Loading product for edit:', productId);
          const product = await apiClient.get<ProductData>(`/api/v1/admin/products/${productId}`);

          const colorDataMap = new Map<string, ColorData>();
          let firstPrice = '';
          let firstCompareAtPrice = '';
          let firstSku = '';

          (product.variants || []).forEach((variant: any, index: number) => {
            console.log(`🔍 [ADMIN] Processing variant ${index}:`, {
              id: variant.id,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock,
              color: variant.color,
              size: variant.size,
              options: variant.options,
              imageUrl: variant.imageUrl,
            });

            const color = extractColor(variant);
            const size = extractSize(variant);

            console.log(`📊 [ADMIN] Extracted from variant ${index}:`, { color, size });

            const stockValue =
              variant.stock !== undefined && variant.stock !== null ? String(variant.stock) : '';

            if (!color) {
              const defaultColor = 'default';
              const defaultColorLabel = t('admin.products.add.defaultColor');

              if (!colorDataMap.has(defaultColor)) {
                const colorData = createDefaultColorData(
                  variant,
                  defaultCurrency,
                  defaultColorLabel,
                  size,
                  stockValue
                );
                colorDataMap.set(defaultColor, colorData);
              } else {
                const existingColorData = colorDataMap.get(defaultColor)!;
                updateDefaultColorData(existingColorData, variant, defaultCurrency, size, stockValue);
              }
            } else if (color) {
              if (!colorDataMap.has(color)) {
                const colorData = createColorData(variant, color, attributes, defaultCurrency, size, stockValue);
                colorDataMap.set(color, colorData);
              } else {
                const existingColorData = colorDataMap.get(color)!;
                updateColorData(existingColorData, variant, defaultCurrency, size, stockValue);
              }
            }

            if (index === 0) {
              const firstPriceValue = variant.price !== undefined && variant.price !== null ? Number(variant.price) : 0;
              const firstCompareAtPriceValue =
                variant.compareAtPrice !== undefined && variant.compareAtPrice !== null
                  ? Number(variant.compareAtPrice)
                  : 0;
              firstPrice = firstPriceValue > 0 ? String(firstPriceValue) : '';
              firstCompareAtPrice =
                firstCompareAtPriceValue > 0 ? String(firstCompareAtPriceValue) : '';
              firstSku = variant.sku || '';
            }
          });

          const mergedVariant: Variant = {
            id: `variant-${Date.now()}-${Math.random()}`,
            price: firstPrice,
            compareAtPrice: firstCompareAtPrice,
            sku: firstSku,
            colors: Array.from(colorDataMap.values()),
          };

          const variantImagesFromColors = collectVariantImagesFromColors(mergedVariant.colors);
          const variantImagesFromProduct = collectVariantImagesFromProductVariants(
            product.variants || []
          );
          const variantImages = new Set([...variantImagesFromColors, ...variantImagesFromProduct]);

          console.log(`🖼️ [ADMIN] Total variant images collected: ${variantImages.size}`);

          const mediaList = product.media || [];
          console.log('🖼️ [ADMIN] Loading main media images. Total media:', mediaList.length);

          const { main } = separateMainAndVariantImages(
            Array.isArray(mediaList) ? mediaList : [],
            variantImages.size > 0 ? Array.from(variantImages) : []
          );

          const normalizedMedia = cleanImageUrls(main);
          const fallbackMedia = cleanImageUrls(Array.isArray(mediaList) ? mediaList : []);
          const effectiveMedia =
            normalizedMedia.length > 0 || fallbackMedia.length === 0 ? normalizedMedia : fallbackMedia;
          console.log(
            `🖼️ [ADMIN] Main media loaded: ${effectiveMedia.length} images (after separation from ${variantImages.size} variant images)`
          );

          const featuredIndexFromApi = Array.isArray(mediaList)
            ? mediaList.findIndex((item: any) => {
                const url = typeof item === 'string' ? item : item?.url || '';
                if (!url) return false;
                return typeof item === 'object' && item?.isFeatured === true;
              })
            : -1;

          const mainProductImage =
            (product as any).mainProductImage || (effectiveMedia.length > 0 ? effectiveMedia[0] : '');

          const formData = buildFormData(
            product,
            effectiveMedia,
            featuredIndexFromApi,
            mainProductImage,
            mergedVariant
          );

          setFormData((prev: any) => ({
            ...prev,
            ...formData,
          }));

          setUseNewBrand(false);
          setUseNewCategory(false);
          setNewBrandName('');
          setNewCategoryName('');

          if (product.variants && product.variants.length > 0) {
            (window as any).__productVariantsToConvert = product.variants;
            setHasVariantsToLoad(true);
          }

          if (product.attributeIds && product.attributeIds.length > 0) {
            (window as any).__productAttributeIds = product.attributeIds;
            console.log('📋 [ADMIN] Product attributeIds loaded:', product.attributeIds);
          }

          const variants = product.variants || [];
          const hasVariants = variants.length > 0;
          const hasVariantsWithAttrs = hasVariantsWithAttributes(variants);

          console.log('📦 [ADMIN] Product type check:', {
            hasVariants,
            variantsCount: variants.length,
            hasVariantsWithAttributes: hasVariantsWithAttrs,
            firstVariant:
              hasVariants && variants.length > 0
                ? {
                    hasAttributes: !!(
                      variants[0] &&
                      (variants[0] as any).attributes &&
                      typeof (variants[0] as any).attributes === 'object' &&
                      Object.keys((variants[0] as any).attributes).length > 0
                    ),
                    hasOptions: !!(
                      (variants[0] as any).options &&
                      Array.isArray((variants[0] as any).options) &&
                      (variants[0] as any).options.length > 0
                    ),
                    attributes: (variants[0] as any).attributes,
                    optionsCount: ((variants[0] as any).options?.length || 0),
                  }
                : null,
          });

          if (!hasVariantsWithAttrs) {
            console.log('📦 [ADMIN] Product variants have no attributes, setting productType to "simple"');
            setProductType('simple');

            if (hasVariants && variants.length > 0) {
              const firstVariant = variants[0] as any;
              setSimpleProductData({
                price: firstVariant.price
                  ? String(
                      typeof firstVariant.price === 'number'
                        ? firstVariant.price
                        : parseFloat(String(firstVariant.price || '0'))
                    )
                  : '',
                compareAtPrice: firstVariant.compareAtPrice
                  ? String(
                      typeof firstVariant.compareAtPrice === 'number'
                        ? firstVariant.compareAtPrice
                        : parseFloat(String(firstVariant.compareAtPrice || '0'))
                    )
                  : '',
                sku: firstVariant.sku || '',
                quantity: String(firstVariant.stock || 0),
              });
            } else {
              setSimpleProductData({
                price: '',
                compareAtPrice: '',
                sku: '',
                quantity: '0',
              });
            }
          } else {
            console.log('📦 [ADMIN] Product variants have attributes, keeping productType as "variable"');
            setProductType('variable');
          }

          console.log('✅ [ADMIN] Product loaded for edit');
        } catch (err: unknown) {
          console.error('❌ [ADMIN] Error loading product:', err);
          router.push('/admin/products');
        } finally {
          setLoadingProduct(false);
        }
      };

      loadProduct();
    }
  }, [
    productId,
    isLoggedIn,
    isAdmin,
    router,
    attributes,
    defaultCurrency,
    setLoadingProduct,
    setFormData,
    setUseNewBrand,
    setUseNewCategory,
    setNewBrandName,
    setNewCategoryName,
    setHasVariantsToLoad,
    setProductType,
    setSimpleProductData,
    t,
  ]);
}
