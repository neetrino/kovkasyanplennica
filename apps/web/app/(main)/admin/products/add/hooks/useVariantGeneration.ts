'use client';

import { useEffect } from 'react';
import type { Attribute, GeneratedVariant } from '../types';
import { generateSlug } from '../utils/productUtils';

interface UseVariantGenerationProps {
  selectedAttributesForVariants: Set<string>;
  selectedAttributeValueIds: Record<string, string[]>;
  attributes: Attribute[];
  generatedVariants: GeneratedVariant[];
  formDataSlug: string;
  formDataTitle: string;
  isEditMode: boolean;
  productId: string | null;
  setGeneratedVariants: (updater: (prev: GeneratedVariant[]) => GeneratedVariant[]) => void;
}

export function useVariantGeneration({
  selectedAttributesForVariants,
  selectedAttributeValueIds,
  attributes,
  generatedVariants: _generatedVariants,
  formDataSlug,
  formDataTitle,
  isEditMode,
  productId,
  setGeneratedVariants,
}: UseVariantGenerationProps) {
  const generateVariantsFromAttributes = () => {

    const selectedAttrs = Array.from(selectedAttributesForVariants);
    if (selectedAttrs.length === 0) {
      setGeneratedVariants(() => []);
      return;
    }

    setGeneratedVariants((prev) => {
      const manuallyAddedVariants = prev.filter((v) => v.id !== 'variant-all');
      const existingAutoVariant = prev.find((v) => v.id === 'variant-all');

      if (manuallyAddedVariants.length > 0) {
        return manuallyAddedVariants;
      }

      const variantId = 'variant-all';
      const allSelectedValueIds: string[] = [];
      selectedAttrs.forEach((attributeId) => {
        const selectedIds = selectedAttributeValueIds[attributeId] || [];
        allSelectedValueIds.push(...selectedIds);
      });

      const baseSlug = formDataSlug || generateSlug(formDataTitle) || 'PROD';
      let sku = `${baseSlug}`;

      if (allSelectedValueIds.length > 0) {
        const valueParts: string[] = [];
        selectedAttrs.forEach((attributeId) => {
          const attribute = attributes.find((a) => a.id === attributeId);
          if (!attribute) return;

          const selectedIds = selectedAttributeValueIds[attributeId] || [];
          selectedIds.forEach((valueId) => {
            const value = attribute.values.find((v) => v.id === valueId);
            if (value) {
              valueParts.push(value.value.toUpperCase().replace(/\s+/g, '-'));
            }
          });
        });

        if (valueParts.length > 0) {
          sku = `${baseSlug}-${valueParts.join('-')}`;
        }
      }

      const autoVariant: GeneratedVariant = {
        id: variantId,
        selectedValueIds: allSelectedValueIds,
        price: existingAutoVariant?.price || '',
        compareAtPrice: existingAutoVariant?.compareAtPrice || '',
        stock: existingAutoVariant?.stock || '',
        sku: existingAutoVariant?.sku || sku,
        image: existingAutoVariant?.image || null,
      };

      const result = [autoVariant];
      return result;
    });

  };

  const applyToAllVariants = (field: 'price' | 'compareAtPrice' | 'stock' | 'sku', value: string) => {
    setGeneratedVariants((prev) =>
      prev.map((variant) => ({
        ...variant,
        [field]: value,
      }))
    );
  };

  useEffect(() => {
    if (isEditMode && productId && (window as any).__productVariantsToConvert) {
      return;
    }

    if (selectedAttributesForVariants.size > 0) {
      generateVariantsFromAttributes();
    } else {
      if (!isEditMode) {
        setGeneratedVariants(() => []);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttributesForVariants, selectedAttributeValueIds, attributes, formDataSlug, formDataTitle, isEditMode, productId]);

  return {
    generateVariantsFromAttributes,
    applyToAllVariants,
  };
}


