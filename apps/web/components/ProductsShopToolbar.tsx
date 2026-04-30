'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { PriceFilter } from '@/components/PriceFilter';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

const pillBase =
  'relative flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[rgba(200,200,200,0.36)] px-4 text-[16px] font-medium tracking-[0.02em] text-[rgba(255,230,196,0.6)] transition-colors hover:bg-[rgba(200,200,200,0.48)]';

function SortChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      className={`shrink-0 opacity-90 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path d="M7 8L10 5L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12L10 15L13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-90" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProductsShopToolbarInner({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'default', label: t('products.header.sort.default') },
    { value: 'price-asc', label: t('products.header.sort.priceAsc') },
    { value: 'price-desc', label: t('products.header.sort.priceDesc') },
    { value: 'name-asc', label: t('products.header.sort.nameAsc') },
    { value: 'name-desc', label: t('products.header.sort.nameDesc') },
  ];

  const sortParam = (searchParams.get('sort') as SortOption) || 'default';
  const sortBy = sortOptions.some((o) => o.value === sortParam) ? sortParam : 'default';

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const applySort = (option: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    if (option === 'default') {
      params.delete('sort');
    } else {
      params.set('sort', option);
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
    setSortOpen(false);
  };

  const category = searchParams.get('category') ?? undefined;
  const minPrice = searchParams.get('minPrice') ?? undefined;
  const maxPrice = searchParams.get('maxPrice') ?? undefined;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            className={`${pillBase} min-w-[168px] pl-11`}
            onClick={() => setSortOpen((v) => !v)}
            aria-expanded={sortOpen}
            aria-haspopup="listbox"
          >
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <SortChevron open={sortOpen} />
            </span>
            {t('products.shop.sort')}
          </button>
          {sortOpen ? (
            <ul
              role="listbox"
              className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[#3d504e] bg-[#2F3F3D] py-1 shadow-xl"
            >
              {sortOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={sortBy === option.value}
                    className={`w-full px-4 py-2.5 text-left text-sm ${
                      sortBy === option.value
                        ? 'bg-white/10 font-semibold text-[#fff4de]'
                        : 'text-[rgba(255,230,196,0.85)] hover:bg-white/5'
                    }`}
                    onClick={() => applySort(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="button"
          className={`${pillBase} min-w-[129px] pl-10`}
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
            <FilterIcon />
          </span>
          {t('products.shop.filter')}
        </button>
      </div>

      {filtersOpen ? (
        <div
          id="products-shop-filters"
          className="mt-4 max-w-xl rounded-2xl border border-[#3d504e] bg-[#2F3F3D]/95 p-4 backdrop-blur-sm"
        >
          <PriceFilter currentMinPrice={minPrice} currentMaxPrice={maxPrice} category={category} />
        </div>
      ) : null}
    </div>
  );
}

export function ProductsShopToolbar({ className }: { className?: string }) {
  return (
    <Suspense fallback={<div className={`h-12 ${className ?? ''}`} />}>
      <ProductsShopToolbarInner className={className} />
    </Suspense>
  );
}
