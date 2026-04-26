'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { OrdersPageContent } from './OrdersPageContent';

export default function OrdersPage() {
  const { t } = useTranslation();
  const { isLoggedIn, canAccessAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.orders.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !canAccessAdmin) {
    return null;
  }

  return <OrdersPageContent />;
}

