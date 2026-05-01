'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { resolveAdminDefaultPath } from '@/lib/auth/roles';
import { StatsGrid } from './components/StatsGrid';
import { RecentOrdersCard } from './components/RecentOrdersCard';
import { TopProductsCard } from './components/TopProductsCard';
import { UserActivityCard } from './components/UserActivityCard';
import { QuickActionsCard } from './components/QuickActionsCard';
import { dashboardMainClass } from './components/dashboardUi';
import { useAdminDashboard } from './hooks/useAdminDashboard';

export default function AdminPanel() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, canAccessAdmin, isLoading, roles } = useAuth();
  const router = useRouter();

  const {
    stats,
    recentOrders,
    topProducts,
    userActivity,
    statsLoading,
    recentOrdersLoading,
    topProductsLoading,
    userActivityLoading,
  } = useAdminDashboard({
    isLoggedIn,
    isAdmin,
    isLoading,
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        console.log('❌ [ADMIN] User not logged in, redirecting to login...');
        router.push('/login');
        return;
      }
      if (!canAccessAdmin) {
        console.log('❌ [ADMIN] User is not admin, redirecting to home...');
        router.push('/');
        return;
      }
      if (!isAdmin) {
        router.replace(resolveAdminDefaultPath(roles));
      }
    }
  }, [isLoggedIn, isAdmin, canAccessAdmin, isLoading, roles, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className="text-sm text-admin-brand/55">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className={dashboardMainClass}>
      <StatsGrid stats={stats} statsLoading={statsLoading} />

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
        <RecentOrdersCard recentOrders={recentOrders} recentOrdersLoading={recentOrdersLoading} />
        <TopProductsCard topProducts={topProducts} topProductsLoading={topProductsLoading} />
      </div>

      <UserActivityCard userActivity={userActivity} userActivityLoading={userActivityLoading} />

      <QuickActionsCard />
    </div>
  );
}
