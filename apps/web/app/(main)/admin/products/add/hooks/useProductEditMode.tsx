import { useEffect, useRef } from 'react';
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
import { markEditTiming, measureEditAsync } from '../utils/editLoadTiming';

interface UseProductEditModeProps {
  productId: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  attributes: any[];
  defaultCurrency: CurrencyCode;
  setLoadingProduct: (loading: boolean) => void;
  setIsProductLoaded: (loaded: boolean) => void;
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
  setIsProductLoaded,
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
  const loadedProductIdRef = useRef<string | null>(null);
  const attributesRef = useRef<any[]>(attributes);

  useEffect(() => {
    attributesRef.current = attributes;
  }, [attributes]);

  useEffect(() => {
    if (!productId || !isLoggedIn || !isAdmin) {
      setIsProductLoaded(false);
      setHasVariantsToLoad(false);
      loadedProductIdRef.current = null;
      return;
    }
    if (loadedProductIdRef.current === productId) {
      return;
    }

    let cancelled = false;
    setIsProductLoaded(false);
    setHasVariantsToLoad(false);

    const loadProduct = async () => {
      try {
        setLoadingProduct(true);
        markEditTiming('product fetch start', { productId });

        const product = await measureEditAsync('product GET', () =>
          apiClient.get<ProductData>(`/api/v1/admin/products/${productId}`)
        );

        if (cancelled) {
          return;
        }

        const snapshotAttributes = attributesRef.current;
        const defaultColorLabel = t('admin.products.add.defaultColor');
        const colorDataMap = new Map<string, ColorData>();
        let firstPrice = '';
        let firstCompareAtPrice = '';
        let firstSku = '';

        (product.variants || []).forEach((variant: any, index: number) => {
          const color = extractColor(variant);
          const size = extractSize(variant);
          const stockValue =
            variant.stock !== undefined && variant.stock !== null ? String(variant.stock) : '';

          if (!color) {
            const defaultColor = 'default';
            if (!colorDataMap.has(defaultColor)) {
              colorDataMap.set(
                defaultColor,
                createDefaultColorData(variant, defaultCurrency, defaultColorLabel, size, stockValue)
              );
            } else {
              updateDefaultColorData(colorDataMap.get(defaultColor)!, variant, defaultCurrency, size, stockValue);
            }
          } else {
            if (!colorDataMap.has(color)) {
              colorDataMap.set(
                color,
                createColorData(variant, color, snapshotAttributes, defaultCurrency, size, stockValue)
              );
            } else {
              updateColorData(colorDataMap.get(color)!, variant, defaultCurrency, size, stockValue);
            }
          }

          if (index === 0) {
            const firstPriceValue =
              variant.price !== undefined && variant.price !== null ? Number(variant.price) : 0;
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
        const variantImagesFromProduct = collectVariantImagesFromProductVariants(product.variants || []);
        const variantImages = new Set([...variantImagesFromColors, ...variantImagesFromProduct]);
        const mediaList = product.media || [];

        const { main } = separateMainAndVariantImages(
          Array.isArray(mediaList) ? mediaList : [],
          variantImages.size > 0 ? Array.from(variantImages) : []
        );

        const normalizedMedia = cleanImageUrls(main);
        const fallbackMedia = cleanImageUrls(Array.isArray(mediaList) ? mediaList : []);
        const effectiveMedia =
          normalizedMedia.length > 0 || fallbackMedia.length === 0 ? normalizedMedia : fallbackMedia;

        const featuredIndexFromApi = Array.isArray(mediaList)
          ? mediaList.findIndex((item: any) => {
              const url = typeof item === 'string' ? item : item?.url || '';
              if (!url) return false;
              return typeof item === 'object' && item?.isFeatured === true;
            })
          : -1;

        const mainProductImage =
          (product as any).mainProductImage || (effectiveMedia.length > 0 ? effectiveMedia[0] : '');

        const nextFormData = buildFormData(
          product,
          effectiveMedia,
          featuredIndexFromApi,
          mainProductImage,
          mergedVariant
        );

        setFormData((prev: any) => ({
          ...prev,
          ...nextFormData,
        }));

        setUseNewBrand(false);
        setUseNewCategory(false);
        setNewBrandName('');
        setNewCategoryName('');

        const variants = product.variants || [];
        const hasVariants = variants.length > 0;
        const hasVariantsWithAttrs = hasVariantsWithAttributes(variants);

        if (hasVariantsWithAttrs) {
          (window as any).__productVariantsToConvert = product.variants;
          setHasVariantsToLoad(true);
        } else {
          delete (window as any).__productVariantsToConvert;
          setHasVariantsToLoad(false);
        }

        if (product.attributeIds && product.attributeIds.length > 0) {
          (window as any).__productAttributeIds = product.attributeIds;
        } else {
          delete (window as any).__productAttributeIds;
        }

        if (!hasVariantsWithAttrs) {
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
          setProductType('variable');
        }

        if (!cancelled) {
          loadedProductIdRef.current = productId;
          setIsProductLoaded(true);
          markEditTiming('product loaded for edit', {
            productId,
            variantCount: variants.length,
            hasVariantsWithAttrs,
          });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error('❌ [ADMIN] Error loading product:', err);
          setIsProductLoaded(false);
          router.push('/admin/products');
        }
      } finally {
        if (!cancelled) {
          setLoadingProduct(false);
        }
      }
    };

    void loadProduct();

    return () => {
      cancelled = true;
      setLoadingProduct(false);
    };
  }, [
    productId,
    isLoggedIn,
    isAdmin,
    defaultCurrency,
    setLoadingProduct,
    setIsProductLoaded,
    setFormData,
    setUseNewBrand,
    setUseNewCategory,
    setNewBrandName,
    setNewCategoryName,
    setHasVariantsToLoad,
    setProductType,
    setSimpleProductData,
    router,
    t,
  ]);
}
