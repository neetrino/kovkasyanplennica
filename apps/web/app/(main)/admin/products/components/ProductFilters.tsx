'use client';

import type { FormEvent } from 'react';
import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import {
  adminFilterLabelClass,
  adminFormControlClass,
  dashboardCardPadding,
} from '../../components/dashboardUi';
import type { Category } from '../types';

interface ProductFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  skuSearch: string;
  setSkuSearch: (sku: string) => void;
  selectedCategories: Set<string>;
  setSelectedCategories: (categories: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesExpanded: boolean;
  setCategoriesExpanded: (expanded: boolean) => void;
  stockFilter: 'all' | 'inStock' | 'outOfStock';
  setStockFilter: (filter: 'all' | 'inStock' | 'outOfStock') => void;
  minPrice: string;
  setMinPrice: (price: string) => void;
  maxPrice: string;
  setMaxPrice: (price: string) => void;
  handleSearch: (e: FormEvent) => void;
  setPage: (page: number | ((prev: number) => number)) => void;
}

export function ProductFilters({
  search,
  setSearch,
  skuSearch,
  setSkuSearch,
  selectedCategories,
  setSelectedCategories,
  categories,
  categoriesLoading,
  categoriesExpanded,
  setCategoriesExpanded,
  stockFilter,
  setStockFilter,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  handleSearch,
  setPage,
}: ProductFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={adminFilterLabelClass}>{t('admin.products.searchByTitleOrSlug')}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e as unknown as FormEvent);
                }
              }}
              placeholder={t('admin.products.searchPlaceholder')}
              className={`${adminFormControlClass} w-full py-2.5`}
            />
          </div>

          <div>
            <label className={adminFilterLabelClass}>{t('admin.products.searchBySku')}</label>
            <input
              type="text"
              value={skuSearch}
              onChange={(e) => {
                setSkuSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('admin.products.skuPlaceholder')}
              className={`${adminFormControlClass} w-full py-2.5`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={adminFilterLabelClass}>{t('admin.products.filterByCategory')}</label>
            <div className="relative" data-category-dropdown>
              <button
                type="button"
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className={`${adminFormControlClass} flex w-full items-center justify-between py-2.5 text-left`}
              >
                <span className="text-admin-brand">
                  {selectedCategories.size === 0
                    ? t('admin.products.allCategories')
                    : selectedCategories.size === 1
                      ? categories.find((c) => selectedCategories.has(c.id))?.title || '1 category'
                      : `${selectedCategories.size} categories`}
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-admin-muted transition-transform duration-200 ${
                    categoriesExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {categoriesExpanded && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-admin-brand-2/20 bg-white shadow-[0_12px_32px_-8px_rgba(47,63,61,0.18)]">
                  {categoriesLoading ? (
                    <div className="p-3 text-center text-sm text-admin-brand/50">
                      {t('admin.products.loadingCategories')}
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="p-3 text-center text-sm text-admin-brand/50">
                      {t('admin.products.noCategoriesAvailable')}
                    </div>
                  ) : (
                    <div className="p-2">
                      <div className="space-y-0.5">
                        {categories.map((category) => (
                          <label
                            key={category.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors hover:bg-admin-surface/80"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategories.has(category.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedCategories);
                                if (e.target.checked) {
                                  newSelected.add(category.id);
                                } else {
                                  newSelected.delete(category.id);
                                }
                                setSelectedCategories(newSelected);
                                setPage(1);
                              }}
                              className="h-4 w-4 rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30"
                            />
                            <span className="text-sm text-admin-brand">{category.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={adminFilterLabelClass}>{t('admin.products.filterByStock')}</label>
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value as 'all' | 'inStock' | 'outOfStock');
                setPage(1);
              }}
              className={`${adminFormControlClass} w-full py-2.5`}
            >
              <option value="all">{t('admin.products.allProducts')}</option>
              <option value="inStock">{t('admin.products.inStock')}</option>
              <option value="outOfStock">{t('admin.products.outOfStock')}</option>
            </select>
          </div>
        </div>
      </div>
    </Card>
  );
}










