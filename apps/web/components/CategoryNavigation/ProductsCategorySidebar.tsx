'use client';

import Link from 'next/link';
import type { MouseEvent, RefObject } from 'react';
import { Suspense, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { CategoryIcon } from './CategoryIcon';
import { useCategories } from './hooks/useCategories';
import { useCategoryProducts } from './hooks/useCategoryProducts';
import type { Category } from './utils';

const CARD_COLUMN_SELECTOR = '[data-products-card-column]';
const PILL_HOVER_GAP_PX = 8;
const PILL_HOVER_MIN_PX = 260;

function useCategoryPillHoverWidthPx(enabled: boolean, navRef: RefObject<HTMLElement | null>) {
  const [hoverPx, setHoverPx] = useState(340);

  const measure = useCallback(() => {
    if (!enabled || typeof document === 'undefined') return;
    const nav = navRef.current;
    const cardCol = document.querySelector(CARD_COLUMN_SELECTOR);
    const firstLink = nav?.querySelector('a');
    if (!nav || !cardCol || !firstLink) return;
    const padLeft = parseFloat(getComputedStyle(cardCol).paddingLeft) || 0;
    const cardContentLeft = cardCol.getBoundingClientRect().left + padLeft;
    const pillLeft = firstLink.getBoundingClientRect().left;
    const w = Math.floor(cardContentLeft - pillLeft - PILL_HOVER_GAP_PX);
    setHoverPx(Math.max(PILL_HOVER_MIN_PX, w));
  }, [enabled, navRef]);

  useLayoutEffect(() => {
    if (!enabled) return;
    const cardCol = document.querySelector(CARD_COLUMN_SELECTOR);
    measure();
    const t = window.setTimeout(measure, 120);
    window.addEventListener('resize', measure);
    const ro =
      typeof ResizeObserver !== 'undefined' && cardCol ? new ResizeObserver(measure) : null;
    if (ro && cardCol) {
      ro.observe(cardCol);
    }
    return () => {
      window.removeEventListener('resize', measure);
      window.clearTimeout(t);
      ro?.disconnect();
    };
  }, [enabled, measure]);

  return hoverPx;
}

function ProductsCategorySidebarSkeleton({ variant }: { variant: 'sidebar' | 'strip' }) {
  const rows = [1, 2, 3, 4, 5, 6, 7];
  if (variant === 'strip') {
    return (
      <div className="flex gap-5 overflow-x-auto pb-2 pt-1">
        {rows.map((i) => (
          <div
            key={i}
            className="h-[84px] min-w-[200px] shrink-0 animate-pulse rounded-br-[120px] rounded-tr-[120px] bg-white/40"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex w-[236px] flex-col items-start gap-5" aria-hidden>
      {rows.map((i) => (
        <div
          key={i}
          className="h-[90px] w-[220px] shrink-0 animate-pulse self-start rounded-br-[140px] rounded-tr-[140px] bg-white/40"
        />
      ))}
    </div>
  );
}

function SidebarCategoryRow({
  category,
  product,
  isActive,
  onCategoryClick,
  t,
  strip,
  fixedSidebarPillWidth,
}: {
  category: Category;
  product: { id: string; slug: string; title: string; image: string | null } | null;
  isActive: boolean;
  onCategoryClick: (categorySlug: string | null) => void;
  t: (path: string) => string;
  strip: boolean;
  /** When true (e.g. mobile drawer), keep pill width; skip page-based hover expansion. */
  fixedSidebarPillWidth?: boolean;
}) {
  const title = category.title;
  const slug = category.slug;

  let labelText = title;
  if (slug === 'all') {
    labelText = t('products.categoryNavigation.shopAll');
  } else if (title.toLowerCase().includes('new')) {
    labelText = t('products.categoryNavigation.newArrivals');
  } else if (title.toLowerCase().includes('sale')) {
    labelText = t('products.categoryNavigation.sale');
  }

  const href = category.slug === 'all' ? '/products' : `/products?category=${category.slug}`;

  const pillClass = strip
    ? 'min-h-[84px] min-w-[200px] shrink-0 rounded-br-[120px] rounded-tr-[120px] bg-white shadow-sm transition-[box-shadow,transform] hover:shadow-md'
    : [
        'relative z-0 min-h-[90px] w-[220px] shrink-0 self-start rounded-br-[140px] rounded-tr-[140px]',
        'py-2 pl-3.5 pr-2',
        'transition-[width,background-color,box-shadow] duration-1000 ease-in-out',
        'hover:z-30 focus-visible:z-30',
      ].join(' ');

  const sidebarSurface = strip
    ? ''
    : fixedSidebarPillWidth
      ? [
          'bg-white shadow-sm',
          'hover:bg-[#fff4de] hover:shadow-md',
          'focus-visible:bg-[#fff4de] focus-visible:shadow-md',
          'outline-none',
          isActive
            ? 'ring-1 ring-[#2F3F3D]/40'
            : 'hover:ring-1 hover:ring-[#2F3F3D]/20 focus-visible:ring-1 focus-visible:ring-[#2F3F3D]/20',
        ].join(' ')
      : [
          'bg-white shadow-sm',
          'hover:w-[var(--products-category-pill-hover)] hover:bg-[#fff4de] hover:shadow-md',
          'focus-visible:w-[var(--products-category-pill-hover)] focus-visible:bg-[#fff4de] focus-visible:shadow-md',

          'outline-none',
          isActive
            ? 'ring-1 ring-[#2F3F3D]/40'
            : 'hover:ring-1 hover:ring-[#2F3F3D]/20 focus-visible:ring-1 focus-visible:ring-[#2F3F3D]/20',
        ].join(' ');

  const labelClasses = strip
    ? `min-w-0 flex-1 font-semibold uppercase leading-snug tracking-wide transition-colors text-[11px] ${
        isActive ? 'text-[#2F3F3D]' : 'text-[#9e9e9e] group-hover:text-[#6b6b6b]'
      }`
    : `min-w-0 flex-1 font-semibold uppercase leading-snug tracking-wide transition-[color,font-weight] duration-1000 ease-in-out text-[12px] ${
        isActive ? 'text-[#2F3F3D]' : 'text-[#9e9e9e]'
      } group-hover:font-bold group-hover:text-[#1a1a1a] group-focus-visible:font-bold group-focus-visible:text-[#1a1a1a]`;

  const iconWrap = strip
    ? 'shrink-0'
    : 'shrink-0 transition-[filter] duration-1000 ease-in-out group-hover:drop-shadow-[0_10px_22px_rgba(47,63,61,0.22)] group-focus-visible:drop-shadow-[0_10px_22px_rgba(47,63,61,0.22)]';

  return (
    <Link
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onCategoryClick(category.slug === 'all' ? null : category.slug);
      }}
      className={`group flex items-center justify-between gap-1.5 ${strip ? pillClass : `${pillClass} ${sidebarSurface}`} ${
        strip ? (isActive ? 'ring-1 ring-[#2F3F3D]/40' : '') : ''
      }`}
    >
      <span className={labelClasses}>{labelText}</span>
      <div className={iconWrap}>
        <CategoryIcon
          category={category}
          product={product}
          isActive={isActive}
          t={t}
          size="sidebar"
          sidebarHoverGrow={!strip}
        />
      </div>
    </Link>
  );
}

function ProductsCategorySidebarInner({
  variant,
  onNavigate,
  fixedSidebarPillWidth,
}: {
  variant: 'sidebar' | 'strip';
  onNavigate?: () => void;
  fixedSidebarPillWidth?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const currentCategory = searchParams?.get('category');
  const categoryNavRef = useRef<HTMLElement>(null);

  const { categories, loading: categoriesLoading } = useCategories();
  const { categoryProducts } = useCategoryProducts(categories);

  const pillHoverEnabled =
    variant === 'sidebar' && !categoriesLoading && !fixedSidebarPillWidth;
  const pillHoverWidthPx = useCategoryPillHoverWidthPx(pillHoverEnabled, categoryNavRef);

  const handleCategoryClick = (categorySlug: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (categorySlug && categorySlug !== 'all') {
      params.set('category', categorySlug);
    } else {
      params.delete('category');
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
    onNavigate?.();
  };

  if (categoriesLoading) {
    return <ProductsCategorySidebarSkeleton variant={variant} />;
  }

  const allCategoriesWithAll = [
    { id: 'all', slug: 'all', title: t('products.categoryNavigation.all'), fullPath: 'all', children: [] } as Category,
    ...categories,
  ];

  const list = (
    <>
      {allCategoriesWithAll.map((category) => {
        const isActive =
          category.slug === 'all' ? !currentCategory : currentCategory === category.slug;
        const product = categoryProducts[category.slug];
        return (
          <SidebarCategoryRow
            key={category.id}
            category={category}
            product={product}
            isActive={isActive}
            onCategoryClick={handleCategoryClick}
            t={t}
            strip={variant === 'strip'}
            fixedSidebarPillWidth={Boolean(fixedSidebarPillWidth)}
          />
        );
      })}
    </>
  );

  if (variant === 'strip') {
    return (
      <nav
        id="products-category-strip"
        className="flex gap-5 overflow-x-auto overscroll-x-contain pb-2 pt-1 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
        aria-label={t('products.shop.categoriesAria')}
      >
        {list}
      </nav>
    );
  }

  return (
    <nav
      ref={categoryNavRef}
      className="flex w-[236px] max-w-full flex-col items-start gap-5 overflow-visible"
      style={{ ['--products-category-pill-hover' as string]: `${pillHoverWidthPx}px` }}
      aria-label={t('products.shop.categoriesAria')}
    >
      {list}
    </nav>
  );
}

export type ProductsCategorySidebarProps = {
  /** Desktop: fixed-width left rail. Mobile: horizontal strip. */
  variant?: 'sidebar' | 'strip';
  /** Called after navigating to a category (e.g. close mobile drawer). */
  onNavigate?: () => void;
  /** Sidebar only: do not expand pills toward the product grid (e.g. overlay drawer). */
  fixedSidebarPillWidth?: boolean;
};

export function ProductsCategorySidebar({
  variant = 'sidebar',
  onNavigate,
  fixedSidebarPillWidth,
}: ProductsCategorySidebarProps) {
  return (
    <Suspense fallback={<ProductsCategorySidebarSkeleton variant={variant === 'strip' ? 'strip' : 'sidebar'} />}>
      <ProductsCategorySidebarInner
        variant={variant === 'strip' ? 'strip' : 'sidebar'}
        onNavigate={onNavigate}
        fixedSidebarPillWidth={fixedSidebarPillWidth}
      />
    </Suspense>
  );
}
