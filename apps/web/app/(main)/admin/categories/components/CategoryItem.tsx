'use client';

import { Button } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import {
  adminBulkDangerButtonClass,
  adminPaginationNavButtonClass,
  dashboardBadgePending,
  dashboardInsetRowCompact,
  dashboardRowMeta,
  dashboardRowPrimaryMedium,
} from '../../components/dashboardUi';
import type { Category, CategoryWithLevel } from '../types';

interface CategoryItemProps {
  category: CategoryWithLevel;
  parentCategory: Category | null;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string, categoryTitle: string) => void;
}

export function CategoryItem({ category, parentCategory, onEdit, onDelete }: CategoryItemProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex items-center justify-between gap-3 ${dashboardInsetRowCompact}`}
      style={{ paddingLeft: `${12 + category.level * 24}px` }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.title}
              className="h-9 w-9 rounded-md border border-admin-brand-2/15 object-cover"
            />
          ) : null}
          <div className={dashboardRowPrimaryMedium}>{category.title}</div>
          {category.requiresSizes ? (
            <span className={dashboardBadgePending} title={t('admin.categories.requiresSizes')}>
              {t('admin.categories.sizesBadge')}
            </span>
          ) : null}
        </div>
        <div className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 ${dashboardRowMeta}`}>
          <span className="font-mono">
            <span className="text-admin-muted">{t('admin.categories.slugLabel')}:</span> {category.slug || '—'}
          </span>
          {parentCategory ? (
            <span className="text-admin-muted">
              → {t('admin.categories.parentCategory')}: {parentCategory.title}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(category)}
          className={adminPaginationNavButtonClass}
        >
          <span className="inline-flex items-center gap-1">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {t('admin.common.edit')}
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onDelete(category.id, category.title)}
          className={adminBulkDangerButtonClass}
        >
          <span className="inline-flex items-center gap-1">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {t('admin.common.delete')}
          </span>
        </Button>
      </div>
    </div>
  );
}
