import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { getStoredLanguage } from '@/lib/language';
import { RESERVED_ROUTES } from '../types';
import type { Product } from '../types';

interface UseProductFetchProps {
  slug: string;
  variantIdFromUrl: string | null;
  /** From RSC — avoids duplicate GET on first paint */
  initialProduct?: Product | null;
}

export function useProductFetch({
  slug,
  variantIdFromUrl,
  initialProduct = null,
}: UseProductFetchProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [loading, setLoading] = useState(() => initialProduct == null);

  const fetchProduct = useCallback(async () => {
    if (!slug || RESERVED_ROUTES.includes(slug.toLowerCase())) return;

    try {
      setLoading(true);
      const currentLang = getStoredLanguage();
      const data = await apiClient.get<Product>(`/api/v1/products/${slug}`, {
        params: { lang: currentLang },
      });

      setProduct(data);
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err?.status === 404) {
        setProduct(null);
      }
    } finally {
      setLoading(false);
    }
  }, [slug, variantIdFromUrl]);

  useEffect(() => {
    if (!slug) return;
    if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
      router.replace(`/${slug}`);
    }
  }, [slug, router]);

  useEffect(() => {
    if (!slug || RESERVED_ROUTES.includes(slug.toLowerCase())) return;

    if (initialProduct && initialProduct.slug === slug) {
      setProduct(initialProduct);
      setLoading(false);
    } else {
      void fetchProduct();
    }

    const handleLanguageUpdate = () => {
      void fetchProduct();
    };

    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [slug, variantIdFromUrl, initialProduct, fetchProduct]);

  return { product, loading, fetchProduct };
}
