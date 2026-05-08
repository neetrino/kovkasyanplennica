'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { formatPrice, getStoredCurrency } from '../lib/currency';
import type { CurrencyCode } from '../lib/currency';
import { useTranslation } from '../lib/i18n-client';
import { APP_SCROLL_REGION_DOM_ID } from '../lib/appScrollRegion';
import { prefetchProductByIntent } from '@/lib/product-intent-prefetch';
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULT_LIMIT = 10;

interface SearchProductItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
}

interface ProductsListResponse {
  data: SearchProductItem[];
}

function getProductHref(slug: string): string {
  const normalizedSlug = slug.trim();
  return normalizedSlug ? `/products/${encodeURIComponent(normalizedSlug)}` : '/products';
}

export type HeaderSearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

/**
 * Full-screen glass search overlay with live product results from `/api/v1/products`.
 */
export function HeaderSearchOverlay({
  open,
  onClose,
  searchQuery,
  onSearchQueryChange,
}: HeaderSearchOverlayProps) {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [results, setResults] = useState<SearchProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>(getStoredCurrency());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onCurrency = () => setCurrency(getStoredCurrency());
    window.addEventListener('currency-updated', onCurrency);
    return () => window.removeEventListener('currency-updated', onCurrency);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setResults([]);
      setLoading(false);
      return;
    }

    const q = searchQuery.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }

    setResults([]);
    setLoading(true);

    const timer = window.setTimeout(async () => {
      const reqId = ++requestIdRef.current;
      try {
        const res = await apiClient.get<ProductsListResponse>('/api/v1/products', {
          params: {
            search: q,
            limit: String(SEARCH_RESULT_LIMIT),
            lang,
          },
        });
        if (reqId !== requestIdRef.current) {
          return;
        }
        setResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (reqId !== requestIdRef.current) {
          return;
        }
        setResults([]);
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [open, searchQuery, lang]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) {
        return;
      }
      onClose();
      router.push(`/products?search=${encodeURIComponent(q)}`);
    },
    [onClose, router, searchQuery]
  );
  const handleProductIntent = useCallback(
    (slug: string) => {
      prefetchProductByIntent(router, slug);
    },
    [router]
  );

  if (!mounted || !open) {
    return null;
  }

  const hint = t('home.header.search.hint');
  const noResults = t('home.header.search.noResults');
  const loadingLabel = t('home.header.search.loading');

  const portalParent =
    document.getElementById(APP_SCROLL_REGION_DOM_ID) ?? document.body;

  return createPortal(
    <div
      className="fixed inset-0 z-app-overlay flex justify-center px-4 pt-16 sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-label={t('home.header.search.overlayAriaLabel')}
    >
      <div
        className="absolute inset-0 bg-[#1f3430]/55 backdrop-blur-md"
        aria-hidden
        role="presentation"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-xl flex-col gap-3">
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-1 -top-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-md transition-opacity hover:bg-white/20 sm:right-0 sm:top-0"
          aria-label={t('home.header.search.close')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-white/50 bg-[#3a5c57]/35 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex items-center gap-2 border-b border-white/25 px-3 py-2.5">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 14L11.1 11.1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              ref={inputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={t('home.header.search.placeholder')}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/65"
            />
          </div>

          <div className="max-h-[min(50vh,380px)] overflow-y-auto overscroll-contain px-2 py-2">
            {!searchQuery.trim() && (
              <p className="px-3 py-6 text-center text-sm text-white/70">{hint}</p>
            )}
            {searchQuery.trim() && loading && (
              <p className="px-3 py-6 text-center text-sm text-sky-200/90">{loadingLabel}</p>
            )}
            {searchQuery.trim() && !loading && results.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-white/75">{noResults}</p>
            )}
            {searchQuery.trim() &&
              !loading &&
              results.map((product) => (
                <Link
                  key={product.id}
                  href={getProductHref(product.slug)}
                  prefetch
                  onMouseEnter={() => handleProductIntent(product.slug)}
                  onTouchStart={() => handleProductIntent(product.slug)}
                  onFocus={() => handleProductIntent(product.slug)}
                  onClick={onClose}
                  className="flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/10"
                >
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt=""
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-white/50">
                        —
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">{product.title}</p>
                    <p className="mt-1 text-sm font-medium text-sky-300">{formatPrice(product.price, currency)}</p>
                  </div>
                </Link>
              ))}
          </div>
        </form>
      </div>
    </div>,
    portalParent
  );
}
