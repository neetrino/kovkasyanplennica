/**
 * Hook for product attribute helper functions
 */

import { useMemo } from 'react';
import type { Attribute } from '../types';

interface UseProductAttributeHelpersProps {
  attributes: Attribute[];
}

export function useProductAttributeHelpers({ attributes }: UseProductAttributeHelpersProps) {
  const colorAttribute = useMemo(() => {
    if (!attributes || attributes.length === 0) {
      return undefined;
    }
    return attributes.find((attr) => attr.key === 'color');
  }, [attributes]);

  const sizeAttribute = useMemo(() => {
    if (!attributes || attributes.length === 0) {
      return undefined;
    }
    return attributes.find((attr) => attr.key === 'size');
  }, [attributes]);

  const getColorAttribute = () => colorAttribute;
  const getSizeAttribute = () => sizeAttribute;

  return {
    colorAttribute,
    sizeAttribute,
    getColorAttribute,
    getSizeAttribute,
  };
}
