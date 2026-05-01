'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { canAccessAdminPath, resolveAdminDefaultPath } from '@/lib/auth/roles';
import { AdminNavThemeProvider } from '@/components/admin/AdminNavThemeContext';
import { useTranslation } from '@/lib/i18n-client';
import { AdminSidebar } from './components/AdminSidebar';
import { getHostessMenuTABS } from './admin-menu.config';

const PRODUCT_SUBNAV_STORAGE_KEY = 'admin-sidebar-products-subnav';
const SIDEBAR_RAIL_COLLAPSED_KEY = 'admin-sidebar-rail-collapsed';

export function AdminLayoutShell({ children }: { children: ReactNode }) {
  const { isLoading, isLoggedIn, roles, isHostess } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const [productSubnavExpanded, setProductSubnavExpanded] = useState(true);
  const [sidebarRailCollapsed, setSidebarRailCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_RAIL_COLLAPSED_KEY) === '1') {
        setSidebarRailCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebarRail = useCallback(() => {
    setSidebarRailCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_RAIL_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PRODUCT_SUBNAV_STORAGE_KEY);
      if (raw === '0') {
        setProductSubnavExpanded(false);
      } else if (raw === '1') {
        setProductSubnavExpanded(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!pathname) {
      return;
    }
    const onProductChild =
      pathname.startsWith('/admin/categories') ||
      pathname.startsWith('/admin/brands') ||
      pathname.startsWith('/admin/attributes');
    if (onProductChild) {
      setProductSubnavExpanded(true);
      try {
        window.localStorage.setItem(PRODUCT_SUBNAV_STORAGE_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }, [pathname]);

  const persistProductSubnav = useCallback((open: boolean) => {
    setProductSubnavExpanded(open);
    try {
      window.localStorage.setItem(PRODUCT_SUBNAV_STORAGE_KEY, open ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const toggleProductSubnav = useCallback(() => {
    persistProductSubnav(!productSubnavExpanded);
  }, [persistProductSubnav, productSubnavExpanded]);

  useEffect(() => {
    if (isLoading || !pathname?.startsWith('/admin')) {
      return;
    }
    if (!isLoggedIn) {
      const encodedPath = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${encodedPath}`);
      return;
    }
    if (!canAccessAdminPath(roles, pathname)) {
      router.replace(resolveAdminDefaultPath(roles));
    }
  }, [isLoading, isLoggedIn, pathname, roles, router]);

  if (!isLoading && pathname?.startsWith('/admin') && (!isLoggedIn || !canAccessAdminPath(roles, pathname))) {
    return null;
  }

  const currentPath = pathname || '/admin';
  const useHostessTabs =
    Boolean(isHostess) &&
    (pathname?.startsWith('/admin/orders') === true || pathname?.startsWith('/admin/desktops') === true);
  const sidebarTabs = useHostessTabs ? getHostessMenuTABS(t) : undefined;

  return (
    <AdminNavThemeProvider>
      <div className="box-border flex min-h-dvh w-full flex-col border border-admin-brand-2/35 bg-admin-surface">
        <div className="flex min-h-0 flex-1 flex-col gap-8 py-8 lg:flex-row">
          <AdminSidebar
            currentPath={currentPath}
            router={router}
            t={t}
            tabs={sidebarTabs}
            productSubnavExpanded={productSubnavExpanded}
            onProductSubnavToggle={toggleProductSubnav}
            toggleProductsSubnavAriaLabel={t('admin.menu.toggleProductsSubnav')}
            sidebarRailCollapsed={sidebarRailCollapsed}
            onToggleSidebarRail={toggleSidebarRail}
            sidebarRailExpandLabel={t('admin.menu.sidebarRailExpand')}
            sidebarRailCollapseLabel={t('admin.menu.sidebarRailCollapse')}
          />
          <div className="min-h-0 min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </AdminNavThemeProvider>
  );
}
