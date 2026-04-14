'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { getStoredLanguage } from '../../../lib/language';
import { flattenCategories, type Category } from '../utils';

interface CategoriesResponse {
  data: Category[];
}

const categoriesCache = new Map<string, Category[]>();

/**
 * Hook for fetching categories
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      const language = getStoredLanguage();
      const cached = categoriesCache.get(language);
      if (cached) {
        setCategories(cached);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/tree', {
          params: { lang: language },
        });

        const categoriesList = response.data || [];
        const allCategories = flattenCategories(categoriesList);
        categoriesCache.set(language, allCategories);
        if (mounted) {
          setCategories(allCategories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  return { categories, loading };
}








