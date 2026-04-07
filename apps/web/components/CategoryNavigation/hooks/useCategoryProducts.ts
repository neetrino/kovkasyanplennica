'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { getStoredLanguage } from '../../../lib/language';
import { CATEGORY_NAV_VISIBLE_COUNT, type Category } from '../utils';

interface Product {
  id: string;
  slug: string;
  title: string;
  image: string | null;
}

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
  };
}

/**
 * Hook for fetching first product with image for each category
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
        const products: Record<string, Product | null> = {};
        
        const allCategoriesWithAll = [
          { id: 'all', slug: 'all', title: t('products.categoryNavigation.all'), fullPath: 'all', children: [] } as Category,
          ...categories
        ];

        /** Only chips visible in the nav — avoid N parallel `/products` calls for the whole tree */
        const categoriesToPreview = allCategoriesWithAll.slice(0, CATEGORY_NAV_VISIBLE_COUNT);

        const categoryPromises = categoriesToPreview.map(async (category) => {
          try {
            const params: Record<string, string> = {
              limit: '3',
              lang: language,
            };
            if (category.slug !== 'all') {
              params.category = category.slug;
            }

            const productsResponse = await apiClient.get<ProductsResponse>('/api/v1/products', {
              params,
            });

            const productWithImage = productsResponse.data && productsResponse.data.length > 0
              ? (productsResponse.data.find(p => p.image) || productsResponse.data[0] || null)
              : null;
            products[category.slug] = productWithImage;
          } catch (err) {
            console.error(`❌ [CategoryNavigation] Error fetching product for category ${category.slug}:`, err);
            products[category.slug] = null;
          }
        });

        await Promise.all(categoryPromises);
        setCategoryProducts(products);
      } catch (err) {
        console.error('Error fetching category products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categories, t]);

  return { categoryProducts, loading };
}








