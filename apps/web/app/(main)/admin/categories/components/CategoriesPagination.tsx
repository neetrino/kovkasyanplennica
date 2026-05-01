'use client';

import { useTranslation } from '@/lib/i18n-client';
import { AdminNumericPagination } from '../../components/AdminNumericPagination';

interface CategoriesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function CategoriesPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: CategoriesPaginationProps) {
  const { t } = useTranslation();

  return (
    <AdminNumericPagination
      wrapperClassName="mt-6 border-t border-admin-brand-2/12 pt-4"
      page={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      summary={t('admin.categories.showingPage')
        .replace('{page}', currentPage.toString())
        .replace('{totalPages}', totalPages.toString())
        .replace('{total}', totalItems.toString())}
      previousLabel={t('admin.categories.previous')}
      nextLabel={t('admin.categories.next')}
    />
  );
}
