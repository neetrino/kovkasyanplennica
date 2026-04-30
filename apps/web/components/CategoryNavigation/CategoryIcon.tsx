'use client';

import Image from 'next/image';
import { getCategoryIcon, type Category, type CategoryIconSize } from './utils';

interface Product {
  id: string;
  slug: string;
  title: string;
  image: string | null;
}

interface CategoryIconProps {
  category: Category;
  product: Product | null;
  isActive: boolean;
  t: (path: string) => string;
  /** Shop sidebar: compact circle */
  size?: CategoryIconSize;
  /** Products sidebar: zoom image inside fixed circle on parent pill hover */
  sidebarHoverGrow?: boolean;
}

/**
 * Component for displaying category icon/image
 */
export function CategoryIcon({
  category,
  product,
  isActive,
  t,
  size = 'default',
  sidebarHoverGrow = false,
}: CategoryIconProps) {
  const title = category.title.toLowerCase();
  const slug = category.slug.toLowerCase();

  const imgZoom =
    size === 'sidebar' && sidebarHoverGrow
      ? 'origin-center transition-transform duration-700 ease-out group-hover:scale-[1.26] group-focus-visible:scale-[1.26]'
      : '';

  // Special categories (all, new, sale) use getCategoryIcon
  if (slug === 'all' || title.includes('new') || title.includes('sale')) {
    const icon = getCategoryIcon(category.title, category.slug, isActive, t, size);
    if (size === 'sidebar' && sidebarHoverGrow) {
      return (
        <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full">
          <div className={imgZoom}>{icon}</div>
        </div>
      );
    }
    return <>{icon}</>;
  }

  const dim = size === 'sidebar' ? 68 : 112;
  const frame =
    size === 'sidebar'
      ? 'flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border border-gray-200 transition-all'
      : 'flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-full border-2 bg-transparent transition-all sm:h-[104px] sm:w-[104px]';

  // Regular categories show product image or placeholder
  return (
    <div
      className={`${frame} ${
        size === 'sidebar'
          ? isActive
            ? 'border-gray-400 shadow-sm'
            : ''
          : isActive
            ? 'border-gray-400 shadow-md'
            : 'border-gray-200'
      }`}
    >
      {(category.imageUrl || product?.image) ? (
        <Image
          src={category.imageUrl || product?.image || ''}
          alt={category.title}
          width={dim}
          height={dim}
          className={`h-full w-full object-cover ${imgZoom}`}
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-100">
          <svg
            className={
              size === 'sidebar'
                ? `h-5 w-5 text-gray-400 ${imgZoom}`
                : 'h-7 w-7 text-gray-400 sm:h-9 sm:w-9'
            }
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      )}
    </div>
  );
}








