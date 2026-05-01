'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { OrdersPageContent } from './OrdersPageContent';

export default function OrdersPage() {
  const { t } = useTranslation();
  const { isLoggedIn, canAccessAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className="text-sm text-admin-brand/55">{t('admin.orders.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !canAccessAdmin) {
    return null;
  }

  return <OrdersPageContent />;
}

