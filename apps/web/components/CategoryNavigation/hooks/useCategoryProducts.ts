'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { getStoredLanguage } from '../../../lib/language';
import { CATEGORY_NAV_PREVIEW_MAX_SLUGS_PER_REQUEST } from '../../../lib/category-nav-preview-limits';
import type { Category } from '../utils';

interface Product {
  id: string;
  slug: string;
  title: string;
  image: string | null;
}

interface NavPreviewsResponse {
  data: Record<string, Product | null>;
}

const categoryPreviewsCache = new Map<string, Record<string, Product | null>>();

/**
 * Fetches one preview product per visible category chip via a single lightweight API (not N× full `/products` list).
 * When `initialNavPreviews` is set (e.g. from RSC), skips the client fetch for first paint.
 */
export function useCategoryProducts(
  categories: Category[],
  initialNavPreviews?: Record<string, Product | null>
) {
  const fromServer = initialNavPreviews !== undefined;

  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product | null>>(() =>
    fromServer ? (initialNavPreviews ?? {}) : {}
  );
  const [loading, setLoading] = useState(() => !fromServer);

  useEffect(() => {
    const applyServerPreviews = () => {
      if (!initialNavPreviews) return;
      const language = getStoredLanguage();
      const allWithAll = [
        { id: 'all', slug: 'all', title: 'all', fullPath: 'all', children: [] } as Category,
        ...categories,
      ];
      const slugList = allWithAll.map((c) => c.slug);
      const cacheKey = `${language}:${slugList.join(',')}`;
      categoryPreviewsCache.set(cacheKey, initialNavPreviews);
      setCategoryProducts(initialNavPreviews);
      setLoading(false);
    };

    if (fromServer) {
      applyServerPreviews();
      return;
    }

    if (categories.length === 0) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchCategoryProducts = async () => {
      try {
        const language = getStoredLanguage();
        setLoading(true);

        const allCategoriesWithAll = [
          { id: 'all', slug: 'all', title: 'all', fullPath: 'all', children: [] } as Category,
          ...categories,
        ];

        const slugList = allCategoriesWithAll.map((c) => c.slug);
        const cacheKey = `${language}:${slugList.join(',')}`;
        const cached = categoryPreviewsCache.get(cacheKey);
        if (cached) {
          if (mounted) {
            setCategoryProducts(cached);
            setLoading(false);
          }
          return;
        }

        const merged: Record<string, Product | null> = {};
        const requests: Promise<NavPreviewsResponse>[] = [];

        for (let i = 0; i < slugList.length; i += CATEGORY_NAV_PREVIEW_MAX_SLUGS_PER_REQUEST) {
          const batch = slugList.slice(i, i + CATEGORY_NAV_PREVIEW_MAX_SLUGS_PER_REQUEST);
          const slugs = batch.join(',');
          requests.push(apiClient.get<NavPreviewsResponse>(
            '/api/v1/products/category-nav-previews',
            { params: { lang: language, slugs } }
          ));
        }

        const responses = await Promise.all(requests);
        for (const response of responses) {
          Object.assign(merged, response.data ?? {});
        }

        categoryPreviewsCache.set(cacheKey, merged);
        if (mounted) {
          setCategoryProducts(merged);
        }
      } catch (err) {
        console.error('Error fetching category nav previews:', err);
        if (mounted) {
          setCategoryProducts({});
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCategoryProducts();

    return () => {
      mounted = false;
    };
  }, [categories, fromServer, initialNavPreviews]);

  return { categoryProducts, loading };
}
