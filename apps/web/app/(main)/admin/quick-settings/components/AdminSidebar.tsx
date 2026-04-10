'use client';

import { useRouter } from 'next/navigation';
import { AdminMenuDrawer } from '@/components/AdminMenuDrawer';
import { useAdminNavTheme } from '@/components/admin/AdminNavThemeContext';
import {
  getAdminNavContainerClass,
  getAdminNavIconClass,
  getAdminNavLinkButtonClasses,
} from '@/components/admin/adminNavClasses';
import { isAdminMenuItemActive } from '@/components/admin/isAdminMenuItemActive';
import type { AdminNavThemeMode } from '@/components/admin/adminNavClasses';
import { getAdminMenuTABS } from '../../admin-menu.config';

interface AdminSidebarProps {
  currentPath: string;
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof import('@/lib/i18n-client').useTranslation>['t'];
}

export function AdminSidebar({ currentPath, router, t }: AdminSidebarProps) {
  const adminTabs = getAdminMenuTABS(t);
  const { isDark } = useAdminNavTheme();
  const mode: AdminNavThemeMode = isDark ? 'dark' : 'light';

  return (
    <>
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
                onClick={() => {
                  router.push(tab.path);
                }}
                className={getAdminNavLinkButtonClasses(mode, isActive, Boolean(tab.isSubCategory))}
              >
                <span className={getAdminNavIconClass(mode, isActive)}>
                  {tab.icon}
                </span>
                <span className="text-left">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}





