'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../lib/api-client';
import type { LanguageCode } from '../../lib/language';

export interface RelatedProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  image: string | null;
  inStock: boolean;
  brand?: {
    id: string;
    name: string;
  } | null;
  categories?: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
  variants?: Array<{
    options?: Array<{
      key: string;
      value: string;
    }>;
  }>;
}

interface UseRelatedProductsProps {
  /** Current PDP slug — loads related list in parallel (no productId / category wait). */
  productSlug: string;
  language: LanguageCode;
  /** From RSC — skips first client fetch when present (including `[]`). */
  initialProducts?: RelatedProduct[];
}

/**
 * Related products via `/api/v1/products/[slug]/related` (server resolves category + exclusion).
 */
export function useRelatedProducts({
  productSlug,
  language,
  initialProducts,
}: UseRelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProduct[]>(() => initialProducts ?? []);
  const [loading, setLoading] = useState(() => initialProducts === undefined);
  const skipClientFetchOnceRef = useRef(initialProducts !== undefined);

  useEffect(() => {
    if (!productSlug.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    if (skipClientFetchOnceRef.current) {
      skipClientFetchOnceRef.current = false;
      setLoading(false);
      return;
    }

    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{
          data: RelatedProduct[];
        }>(`/api/v1/products/${encodeURIComponent(productSlug)}/related`, {
          params: { lang: language },
        });

        const rows = response.data && Array.isArray(response.data) ? response.data : [];
        setProducts(rows.slice(0, 10));
      } catch (error) {
        console.error('[RelatedProducts] Error fetching related products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchRelatedProducts();
  }, [productSlug, language]);

  return { products, loading };
}
