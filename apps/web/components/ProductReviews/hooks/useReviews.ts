'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../lib/api-client';
import { getStoredLanguage } from '../../../lib/language';
import type { Review } from '../utils';

/**
 * Fetches reviews by slug (preferred) or productId — runs as soon as slug is known (parallel with product).
 * When `initialReviews` is set (RSC), skips the first client GET for faster hydration.
 */
export function useReviews(
  productId?: string,
  productSlug?: string,
  initialReviews?: Review[],
) {
  const [reviews, setReviews] = useState<Review[]>(() => initialReviews ?? []);
  const [loading, setLoading] = useState(() => initialReviews === undefined);
  const skipClientFetchOnceRef = useRef(initialReviews !== undefined);

  const identifier = productSlug ?? productId ?? '';

  const loadReviews = useCallback(async () => {
    const id = productSlug ?? productId;
    if (!id) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const lang = getStoredLanguage();
      const data = await apiClient.get<Review[]>(`/api/v1/products/${encodeURIComponent(id)}/reviews`, {
        params: { lang },
      });
      setReviews(data || []);
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status !== 404) {
        console.error('Failed to load reviews:', error);
      }
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId, productSlug]);

  useEffect(() => {
    if (!identifier) {
      setReviews([]);
      setLoading(false);
      return;
    }
    if (skipClientFetchOnceRef.current) {
      skipClientFetchOnceRef.current = false;
      setLoading(false);
      return;
    }
    void loadReviews();
  }, [identifier, loadReviews]);

  useEffect(() => {
    const onUpdate = () => {
      void loadReviews();
    };
    window.addEventListener('review-updated', onUpdate);
    return () => window.removeEventListener('review-updated', onUpdate);
  }, [loadReviews]);

  return {
    reviews,
    loading,
    setReviews,
    loadReviews,
  };
}
