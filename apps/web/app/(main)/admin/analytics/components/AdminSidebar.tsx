'use client';

import { useRouter, usePathname } from 'next/navigation';
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
  t: (key: string) => string;
}

export function AdminSidebar({ t }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const adminTabs = getAdminMenuTABS(t);
  const { isDark } = useAdminNavTheme();
  const mode: AdminNavThemeMode = isDark ? 'dark' : 'light';
  return (
    <>
      <div className="lg:hidden mb-6">
        <AdminMenuDrawer tabs={adminTabs} currentPath={pathname || '/admin/analytics'} />
      </div>
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <nav className={getAdminNavContainerClass(mode)}>
          {adminTabs.map((tab) => {
            const isActive = isAdminMenuItemActive(tab.path, pathname ?? '');
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

