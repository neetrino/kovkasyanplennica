'use client';

import { useTranslation } from '@/lib/i18n-client';
import { AdminNumericPagination } from '../../components/AdminNumericPagination';

interface OrdersPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export function OrdersPagination({ page, totalPages, total, onPageChange }: OrdersPaginationProps) {
  const { t } = useTranslation();

  return (
    <AdminNumericPagination
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      summary={t('admin.orders.showingPage')
        .replace('{page}', page.toString())
        .replace('{totalPages}', totalPages.toString())
        .replace('{total}', total.toString())}
      previousLabel={t('admin.orders.previous')}
      nextLabel={t('admin.orders.next')}
    />
  );
}
