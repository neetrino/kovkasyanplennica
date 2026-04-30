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
 * Hook for fetching categories.
 * When `initialCategories` is set (e.g. from the products page RSC), skips the client round-trip.
 */
export function useCategories(initialCategories?: Category[]) {
  const hydratedFromServer = initialCategories !== undefined;

  const [categories, setCategories] = useState<Category[]>(() =>
    hydratedFromServer ? initialCategories : []
  );
  const [loading, setLoading] = useState(() => !hydratedFromServer);

  const serverTreeSignature = hydratedFromServer
    ? initialCategories.map((c) => c.id).join(',')
    : '';

  useEffect(() => {
    if (hydratedFromServer) {
      setCategories(initialCategories);
      setLoading(false);
      const language = getStoredLanguage();
      if (initialCategories.length > 0) {
        categoriesCache.set(language, initialCategories);
      }
      return;
    }

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
  }, [hydratedFromServer, initialCategories, serverTreeSignature]);

  return { categories, loading };
}








