'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '../lib/i18n-client';
import { useCategories } from './CategoryNavigation/hooks/useCategories';
import { useCategoryProducts } from './CategoryNavigation/hooks/useCategoryProducts';
import { useCategoryScroll } from './CategoryNavigation/hooks/useCategoryScroll';
import { CategoryItem } from './CategoryNavigation/CategoryItem';
import { CategoryEdgeScrollButton } from './CategoryNavigation/CategoryScrollButtons';
import { CategoryNavigationLoading } from './CategoryNavigation/CategoryNavigationLoading';
import type { Category } from './CategoryNavigation/utils';

function CategoryNavigationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const currentCategory = searchParams?.get('category');
  
  const { categories, loading: categoriesLoading } = useCategories();
  const { categoryProducts } = useCategoryProducts(categories);
  const {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    scrollByAmount,
    updateScrollButtons,
  } = useCategoryScroll();

  const handleCategoryClick = (categorySlug: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    
    if (categorySlug && categorySlug !== 'all') {
      params.set('category', categorySlug);
    } else {
      params.delete('category');
    }
    
    // Reset to page 1 when changing category
    params.delete('page');
    
    router.push(`/products?${params.toString()}`);
  };

  useEffect(() => {
    if (!categoriesLoading && categories.length > 0) {
      const timeoutId = setTimeout(() => updateScrollButtons(), 200);
      return () => clearTimeout(timeoutId);
    }
  }, [categories.length, Object.keys(categoryProducts).length, categoriesLoading, updateScrollButtons]);

  if (categoriesLoading) {
    return <CategoryNavigationLoading />;
  }

  // Add "All" category at the beginning
  const allCategoriesWithAll = [
    { id: 'all', slug: 'all', title: t('products.categoryNavigation.all'), fullPath: 'all', children: [] } as Category,
    ...categories
  ];

  const displayCategories = allCategoriesWithAll;

  return (
    <div className="bg-[#2F3F3D] border-b border-[#3d504e] py-4 sm:py-5 md:py-7 w-full">
      <div className="w-full px-3 sm:px-5 md:px-7 lg:px-10">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <CategoryEdgeScrollButton
            direction="left"
            canScroll={canScrollLeft}
            onPress={() => scrollByAmount(-270)}
            label={t('products.categoryNavigation.scrollLeft')}
          />
          <div
            ref={scrollContainerRef}
            className="flex min-h-[96px] min-w-0 flex-1 touch-pan-x items-center gap-6 overflow-x-auto overscroll-x-contain scrollbar-hide pb-2 pl-2 sm:min-h-[116px] sm:gap-8 sm:pb-2 sm:pl-2 md:gap-10"
            style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
          >
            {displayCategories.map((category) => {
              const isActive = category.slug === 'all' 
                ? !currentCategory 
                : currentCategory === category.slug;
              const product = categoryProducts[category.slug];

              return (
                <CategoryItem
                  key={category.id}
                  category={category}
                  product={product}
                  isActive={isActive}
                  currentCategory={currentCategory}
                  onCategoryClick={handleCategoryClick}
                  t={t}
                />
              );
            })}
          </div>
          <CategoryEdgeScrollButton
            direction="right"
            canScroll={canScrollRight}
            onPress={() => scrollByAmount(270)}
            label={t('products.categoryNavigation.scrollRight')}
          />
        </div>
      </div>
    </div>
  );
}

export function CategoryNavigation() {
  return (
    <Suspense fallback={<CategoryNavigationLoading />}>
      <CategoryNavigationContent />
    </Suspense>
  );
}


