'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { AdminMenuDrawer } from '@/components/AdminMenuDrawer';
import {
  getAdminNavContainerClass,
  getAdminNavIconClass,
  getAdminNavLinkButtonClasses,
} from '@/components/admin/adminNavClasses';
import { isAdminMenuItemActive } from '@/components/admin/isAdminMenuItemActive';
import type { AdminNavThemeMode } from '@/components/admin/adminNavClasses';
import { useAdminNavTheme } from '@/components/admin/AdminNavThemeContext';
import { getAdminMenuTABS } from '../admin-menu.config';
import { useTranslation } from '@/lib/i18n-client';
import { VacanciesAdminSection } from './VacanciesAdminSection';

export default function AdminVacanciesPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState(pathname || '/admin/vacancies');

  useEffect(() => {
    if (pathname) setCurrentPath(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/admin');
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const { isDark } = useAdminNavTheme();
  const mode: AdminNavThemeMode = isDark ? 'dark' : 'light';
  const adminTabs = getAdminMenuTABS(t);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('admin.common.backToAdmin')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.vacancies.title')}</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden mb-6">
            <AdminMenuDrawer tabs={adminTabs} currentPath={currentPath} />
          </div>
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <nav className={getAdminNavContainerClass(mode)}>
              {adminTabs.map((tab) => {
                const isActive = isAdminMenuItemActive(tab.path, currentPath);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => router.push(tab.path)}
                    className={getAdminNavLinkButtonClasses(mode, isActive, Boolean(tab.isSubCategory))}
                  >
                    <span className={getAdminNavIconClass(mode, isActive)}>{tab.icon}</span>
                    <span className="text-left">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            <Card className="p-6">
              <VacanciesAdminSection />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
