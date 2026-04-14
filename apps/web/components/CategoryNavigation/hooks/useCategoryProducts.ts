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

/**
 * Fetches one preview product per visible category chip via a single lightweight API (not N× full `/products` list).
 */
export function useCategoryProducts(categories: Category[], t: (path: string) => string) {
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categories.length === 0) {
      setLoading(false);
      return;
    }

    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const language = getStoredLanguage();

        const allCategoriesWithAll = [
          { id: 'all', slug: 'all', title: t('products.categoryNavigation.all'), fullPath: 'all', children: [] } as Category,
          ...categories
        ];

        const slugList = allCategoriesWithAll.map((c) => c.slug);
        const merged: Record<string, Product | null> = {};

        for (let i = 0; i < slugList.length; i += CATEGORY_NAV_PREVIEW_MAX_SLUGS_PER_REQUEST) {
          const batch = slugList.slice(i, i + CATEGORY_NAV_PREVIEW_MAX_SLUGS_PER_REQUEST);
          const slugs = batch.join(',');

          const response = await apiClient.get<NavPreviewsResponse>(
            '/api/v1/products/category-nav-previews',
            { params: { lang: language, slugs } }
          );

          Object.assign(merged, response.data ?? {});
        }

        setCategoryProducts(merged);
      } catch (err) {
        console.error('Error fetching category nav previews:', err);
        setCategoryProducts({});
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categories, t]);

  return { categoryProducts, loading };
}
