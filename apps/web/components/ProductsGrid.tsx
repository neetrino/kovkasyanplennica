'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { useTranslation } from '../lib/i18n-client';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  inStock: boolean;
  brand: {
    id: string;
    name: string;
  } | null;
  /** Primary category title for ProductCard display (from API categories[0].title) */
  category?: string;
}

type ViewMode = 'list' | 'grid-2' | 'grid-3';

interface ProductsGridProps {
  products: Product[];
  sortBy?: string;
  /** Products page: 2 cols desktop, 3 cols tablet (like home menu) */
  gridLayout?: 'default' | 'productsPage';
}

const MOBILE_BREAKPOINT = 768;

export function ProductsGrid({ products, sortBy = 'default', gridLayout = 'default' }: ProductsGridProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('grid-3');
  const [sortedProducts, setSortedProducts] = useState<Product[]>(products);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load view mode from localStorage (default grid-3 = 4 columns, Figma-like)
  useEffect(() => {
    const stored = localStorage.getItem('products-view-mode');
    if (stored && ['list', 'grid-2', 'grid-3'].includes(stored)) {
      setViewMode(stored as ViewMode);
    } else {
      setViewMode('grid-3');
      localStorage.setItem('products-view-mode', 'grid-3');
    }
  }, []);

  // Listen for view mode changes
  useEffect(() => {
    const handleViewModeChange = (_event: CustomEvent) => {
      setViewMode((_event as CustomEvent).detail);
    };

    window.addEventListener('view-mode-changed', handleViewModeChange as (_event: Event) => void);
    return () => {
      window.removeEventListener('view-mode-changed', handleViewModeChange as (_event: Event) => void);
    };
  }, []);

  // Sort products
  useEffect(() => {
    let sorted = [...products];

    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        // Keep original order
        break;
    }

    setSortedProducts(sorted);
  }, [products, sortBy]);

  const gridClasses =
    gridLayout === 'productsPage'
      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8'
      : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-[250px] sm:gap-x-8 md:gap-x-10 lg:gap-x-12 xl:gap-x-14';

  if (sortedProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('products.grid.noProducts')}</p>
      </div>
    );
  }

  const effectiveViewMode = gridLayout === 'productsPage' ? 'grid-3' : viewMode;
  const compactHeight = gridLayout === 'productsPage' && isMobile;

  return (
    <div className={gridClasses}>
      {sortedProducts.map((product) => (
        <ProductCard 
          key={product.id} 
          product={{
            ...product,
            compareAtPrice: product.compareAtPrice ?? undefined
          }} 
          viewMode={effectiveViewMode}
          compactHeight={compactHeight}
        />
      ))}
    </div>
  );
}

