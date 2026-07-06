'use client';

import { useEffect } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import type { GeneratedVariant } from '../types';
import { markEditTiming } from '../utils/editLoadTiming';

interface UseProductVariantConversionProps {
  productId: string | null;
  attributes: any[];
  hasVariantsToLoad: boolean;
  isReferenceLoaded: boolean;
  defaultCurrency: CurrencyCode;
  setSelectedAttributesForVariants: (attrs: Set<string>) => void;
  setSelectedAttributeValueIds: (ids: Record<string, string[]>) => void;
  setGeneratedVariants: (variants: GeneratedVariant[]) => void;
  setHasVariantsToLoad: (has: boolean) => void;
}

export function useProductVariantConversion({
  productId,
  attributes,
  hasVariantsToLoad,
  isReferenceLoaded,
  defaultCurrency,
  setSelectedAttributesForVariants,
  setSelectedAttributeValueIds,
  setGeneratedVariants,
  setHasVariantsToLoad,
}: UseProductVariantConversionProps) {
  useEffect(() => {
    if (productId && attributes.length > 0 && (window as any).__productVariantsToConvert) {
      const conversionStart = typeof performance !== 'undefined' ? performance.now() : 0;
      markEditTiming('variant conversion start');
      const productVariants = (window as any).__productVariantsToConvert;
      
      const attributeIdsSet = new Set<string>();
      const attributeValueIdsMap: Record<string, string[]> = {};
      
      productVariants.forEach((variant: any) => {
        if (variant.options && Array.isArray(variant.options)) {
          variant.options.forEach((opt: any) => {
            let attributeId = opt.attributeId;
            let valueId = opt.valueId;
            
            if (!attributeId && opt.attributeValue) {
              attributeId = opt.attributeValue.attributeId || opt.attributeValue.attribute?.id;
            }
            if (!valueId && opt.attributeValue) {
              valueId = opt.attributeValue.id;
            }
            
            if (attributeId && valueId) {
              attributeIdsSet.add(attributeId);
              
              if (!attributeValueIdsMap[attributeId]) {
                attributeValueIdsMap[attributeId] = [];
              }
              if (!attributeValueIdsMap[attributeId].includes(valueId)) {
                attributeValueIdsMap[attributeId].push(valueId);
              }
            }
          });
        }
      });
      
      const productAttributeIds = (window as any).__productAttributeIds || [];
      if (productAttributeIds.length > 0) {
        productAttributeIds.forEach((attrId: string) => {
          attributeIdsSet.add(attrId);
        });
      }

      if (attributeIdsSet.size > 0) {
        setSelectedAttributesForVariants(attributeIdsSet);
      }
      
      if (Object.keys(attributeValueIdsMap).length > 0) {
        setSelectedAttributeValueIds(attributeValueIdsMap);
      }
      
      interface VariantData {
        id: string;
        selectedValueIds: string[];
        price: number;
        compareAtPrice: number | null;
        stock: number;
        sku: string;
        image: string | null;
        originalVariantIds: string[];
      }
      
      const variantDataList: VariantData[] = [];
      
      productVariants.forEach((variant: any, variantIndex: number) => {
        const selectedValueIds: string[] = [];
        
        if (variant.attributes && typeof variant.attributes === 'object') {
          Object.keys(variant.attributes).forEach((attributeKey) => {
            const attribute = attributes.find(a => a.key === attributeKey);
            if (!attribute) {
              if (process.env.NODE_ENV === 'development') {
                console.warn(`⚠️ [ADMIN] Attribute not found for key: ${attributeKey}`);
              }
              return;
            }
            
            const attributeValues = variant.attributes[attributeKey];
            if (Array.isArray(attributeValues)) {
              attributeValues.forEach((attrValue: any) => {
                const valueId = attrValue.valueId || attrValue.id;
                const value = attrValue.value || attrValue;
                
                if (valueId) {
                  if (!selectedValueIds.includes(valueId)) {
                    selectedValueIds.push(valueId);
                  }
                } else if (value) {
                  const foundValue = attribute.values.find((v: { id: string; value: string; label: string }) => 
                    v.value === value || v.label === value
                  );
                  if (foundValue && !selectedValueIds.includes(foundValue.id)) {
                    selectedValueIds.push(foundValue.id);
                  }
                }
              });
            }
          });
        }
        
        if (selectedValueIds.length === 0 && variant.options && Array.isArray(variant.options)) {
          const attributeValueMap: Record<string, Set<string>> = {};
          
          variant.options.forEach((opt: any) => {
            let attributeId = opt.attributeId;
            let valueId = opt.valueId;
            let attributeKey = opt.attributeKey;
            
            if (!attributeId && opt.attributeValue) {
              attributeId = opt.attributeValue.attributeId || opt.attributeValue.attribute?.id || opt.attributeValue.attributeId;
              attributeKey = opt.attributeValue.attribute?.key || opt.attributeValue.attributeKey;
            }
            if (!valueId && opt.attributeValue) {
              valueId = opt.attributeValue.id || opt.attributeValue.valueId;
            }
            
            if (!attributeId && opt.attributeKey) {
              const foundAttr = attributes.find(a => a.key === opt.attributeKey);
              if (foundAttr) {
                attributeId = foundAttr.id;
                attributeKey = foundAttr.key;
              }
            }
            
            if (attributeId && !valueId && opt.value) {
              const foundAttr = attributes.find(a => a.id === attributeId);
              if (foundAttr) {
                const foundValue = foundAttr.values.find((v: { id: string; value: string; label: string }) => v.value === opt.value || v.label === opt.value);
                if (foundValue) {
                  valueId = foundValue.id;
                }
              }
            }
            
            if (attributeKey && valueId) {
              if (!attributeValueMap[attributeKey]) {
                attributeValueMap[attributeKey] = new Set();
              }
              attributeValueMap[attributeKey].add(valueId);
            }
          });
          
          Object.values(attributeValueMap).forEach((valueIdSet) => {
            valueIdSet.forEach((valueId) => {
              if (!selectedValueIds.includes(valueId)) {
                selectedValueIds.push(valueId);
              }
            });
          });
        }
        
        let variantImage: string | null = null;
        if (variant.imageUrl) {
          if (typeof variant.imageUrl === 'string' && variant.imageUrl.startsWith('data:')) {
            variantImage = variant.imageUrl;
          } else {
            const imageUrls = typeof variant.imageUrl === 'string'
              ? variant.imageUrl.split(',').map((url: string) => url.trim()).filter(Boolean)
              : [];
            variantImage = imageUrls.length > 0 ? imageUrls[0] : null;
          }
        }
        
        const priceInDefaultCurrency =
          variant.price !== undefined && variant.price !== null
            ? Number(variant.price)
            : 0;
        const compareAtPriceInDefaultCurrency =
          variant.compareAtPrice !== undefined && variant.compareAtPrice !== null
            ? Number(variant.compareAtPrice)
            : null;
        
        variantDataList.push({
          id: variant.id || `variant-${Date.now()}-${variantIndex}-${Math.random()}`,
          selectedValueIds: selectedValueIds.sort(),
          price: priceInDefaultCurrency,
          compareAtPrice: compareAtPriceInDefaultCurrency,
          stock: variant.stock !== undefined && variant.stock !== null ? variant.stock : 0,
          sku: variant.sku || '',
          image: variantImage,
          originalVariantIds: [variant.id || `variant-${variantIndex}`],
        });
      });
      
      const variantGroups = new Map<string, VariantData[]>();
      
      variantDataList.forEach((variantData) => {
        const valueIdsKey = variantData.selectedValueIds.join(',');
        const priceKey = variantData.price.toString();
        const compareAtPriceKey = variantData.compareAtPrice !== null ? variantData.compareAtPrice.toString() : 'null';
        
        const groupKey = `${valueIdsKey}|${priceKey}|${compareAtPriceKey}`;
        
        if (!variantGroups.has(groupKey)) {
          variantGroups.set(groupKey, []);
        }
        variantGroups.get(groupKey)!.push(variantData);
      });
      
      const convertedVariants: Array<{
        id: string;
        selectedValueIds: string[];
        price: string;
        compareAtPrice: string;
        stock: string;
        sku: string;
        image: string | null;
      }> = [];
      
      variantGroups.forEach((group, groupKey) => {
        const allValueIds = new Set<string>();
        group.forEach(variantData => {
          variantData.selectedValueIds.forEach(valueId => {
            allValueIds.add(valueId);
          });
        });
        
        const firstVariant = group[0];
        const allStocksSame = group.every(v => v.stock === firstVariant.stock);
        const stockValue = allStocksSame ? firstVariant.stock : firstVariant.stock;
        
        const combinedSku = group.length === 1 
          ? firstVariant.sku 
          : group.map(v => v.sku).filter(Boolean).join(', ');
        
        const combinedImage = firstVariant.image;
        
        convertedVariants.push({
          id: `variant-group-${Date.now()}-${Math.random()}`,
          selectedValueIds: Array.from(allValueIds).sort(),
          price: firstVariant.price.toString(),
          compareAtPrice: firstVariant.compareAtPrice !== null ? firstVariant.compareAtPrice.toString() : '',
          stock: stockValue.toString(),
          sku: combinedSku,
          image: combinedImage,
        });
      });
      
      if (convertedVariants.length > 0) {
        setGeneratedVariants(convertedVariants);
        delete (window as any).__productVariantsToConvert;
        setHasVariantsToLoad(false);
        markEditTiming('variant conversion end', {
          durationMs: typeof performance !== 'undefined' ? Math.round(performance.now() - conversionStart) : null,
          convertedCount: convertedVariants.length,
          sourceCount: productVariants.length,
        });
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ [ADMIN] No variants converted.');
        }
        setHasVariantsToLoad(false);
      }
    } else if (
      productId &&
      isReferenceLoaded &&
      hasVariantsToLoad &&
      attributes.length === 0
    ) {
      console.warn('⚠️ [ADMIN] Variant conversion skipped: attributes empty after reference data loaded.');
      delete (window as any).__productVariantsToConvert;
      setHasVariantsToLoad(false);
    } else if (
      productId &&
      isReferenceLoaded &&
      hasVariantsToLoad &&
      attributes.length > 0 &&
      !(window as any).__productVariantsToConvert
    ) {
      setHasVariantsToLoad(false);
    }
  }, [productId, attributes, hasVariantsToLoad, isReferenceLoaded, defaultCurrency, setSelectedAttributesForVariants, setSelectedAttributeValueIds, setGeneratedVariants, setHasVariantsToLoad]);
}

