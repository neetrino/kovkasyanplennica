import type { ReactNode } from 'react';

export interface Category {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  imageUrl?: string | null;
  children: Category[];
}

/**
 * Flatten categories tree to get all categories
 */
export function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  cats.forEach((cat) => {
    result.push(cat);
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children));
    }
  });
  return result;
}

const iconSizeClasses = {
  default: 'w-[80px] h-[80px] sm:w-[104px] sm:h-[104px]',
  sidebar: 'h-[68px] w-[68px]',
} as const;

const labelSizeClasses = {
  default: 'text-sm sm:text-base',
  sidebar: 'text-[9px] leading-tight',
} as const;

export type CategoryIconSize = keyof typeof iconSizeClasses;

/**
 * Get category icon based on title/slug
 */
export function getCategoryIcon(
  categoryTitle: string,
  categorySlug: string,
  isActive: boolean,
  t: (path: string) => string,
  size: CategoryIconSize = 'default'
): ReactNode {
  const title = categoryTitle.toLowerCase();
  const slug = categorySlug.toLowerCase();
  const box = iconSizeClasses[size];
  const label = labelSizeClasses[size];
  const labelWeight = size === 'sidebar' ? 'font-semibold' : 'font-bold';

  // ALL category - grey circle
  if (title === 'all' || slug === 'all') {
    return (
      <div
        className={`${box} flex shrink-0 items-center justify-center rounded-full transition-all ${
          isActive ? 'bg-gray-300' : 'bg-gray-200'
        }`}
      >
        <span className={`${labelWeight} text-gray-900 ${label}`}>{t('products.categoryNavigation.labels.all')}</span>
      </div>
    );
  }

  // NEW category - green circle
  if (title.includes('new') || slug.includes('new')) {
    return (
      <div
        className={`${box} flex shrink-0 items-center justify-center rounded-full transition-all ${
          isActive ? 'bg-green-200' : 'bg-green-100'
        }`}
      >
        <span className={`${labelWeight} text-green-700 ${label}`}>{t('products.categoryNavigation.labels.new')}</span>
      </div>
    );
  }

  // SALE category - red circle
  if (title.includes('sale') || slug.includes('sale')) {
    return (
      <div
        className={`${box} flex shrink-0 items-center justify-center rounded-full transition-all ${
          isActive ? 'bg-red-200' : 'bg-red-100'
        }`}
      >
        <span className={`${labelWeight} text-red-700 ${label}`}>{t('products.categoryNavigation.labels.sale')}</span>
      </div>
    );
  }

  // Default - white circle (will be filled with product image if available)
  return (
    <div
      className={`${box} flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-transparent`}
    >
      {/* Product image will be inserted here if available */}
    </div>
  );
}








