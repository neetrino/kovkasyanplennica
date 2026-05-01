'use client';

import { useRouter } from 'next/navigation';
import { AdminMenuDrawer } from '@/components/AdminMenuDrawer';
import type { AdminMenuItem } from '@/components/AdminMenuDrawer';
import { useAdminNavTheme } from '@/components/admin/AdminNavThemeContext';
import {
  getAdminNavContainerClass,
  getAdminNavGroupToggleClasses,
  getAdminNavIconClass,
  getAdminNavLinkButtonClasses,
} from '@/components/admin/adminNavClasses';
import { isAdminMenuItemActive } from '@/components/admin/isAdminMenuItemActive';
import type { AdminNavThemeMode } from '@/components/admin/adminNavClasses';
import { getAdminMenuTABS } from '../admin-menu.config';

interface AdminSidebarProps {
  currentPath: string;
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof import('@/lib/i18n-client').useTranslation>['t'];
  tabs?: AdminMenuItem[];
  productSubnavExpanded: boolean;
  onProductSubnavToggle: () => void;
  toggleProductsSubnavAriaLabel: string;
  sidebarRailCollapsed: boolean;
  onToggleSidebarRail: () => void;
  sidebarRailExpandLabel: string;
  sidebarRailCollapseLabel: string;
}

export function AdminSidebar({
  currentPath,
  router,
  t,
  tabs,
  productSubnavExpanded,
  onProductSubnavToggle,
  toggleProductsSubnavAriaLabel,
  sidebarRailCollapsed,
  onToggleSidebarRail,
  sidebarRailExpandLabel,
  sidebarRailCollapseLabel,
}: AdminSidebarProps) {
  const adminTabs = tabs ?? getAdminMenuTABS(t);
  const { isDark } = useAdminNavTheme();
  const mode: AdminNavThemeMode = isDark ? 'dark' : 'light';
  const railWide = !sidebarRailCollapsed;
  const shellWidthClass = railWide ? 'lg:w-64' : 'lg:w-24';
  const collapsedBtn = sidebarRailCollapsed ? '!justify-center !gap-0 !px-2 !pl-2' : '';

  return (
    <>
      <div className="mb-6 lg:hidden">
        <AdminMenuDrawer
          tabs={adminTabs}
          currentPath={currentPath}
          productSubnavExpanded={productSubnavExpanded}
          onProductSubnavToggle={onProductSubnavToggle}
          toggleProductsSubnavAriaLabel={toggleProductsSubnavAriaLabel}
        />
      </div>
      <div
        className={`hidden transition-[width] duration-200 ease-out lg:block lg:flex-shrink-0 ${shellWidthClass}`}
        aria-hidden="true"
      />
      <aside
        className={`hidden border-r border-admin-brand-2/50 bg-admin-brand transition-[width] duration-200 ease-out lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:h-dvh lg:max-h-dvh lg:flex-col lg:p-0 lg:overflow-hidden ${shellWidthClass}`}
      >
        {(() => {
          const logoTab = adminTabs.find((tab) => tab.isSiteLogoNav);
          if (!logoTab) {
            return null;
          }
          const logoActive = isAdminMenuItemActive(logoTab.path, currentPath);
          const railToggleClass = `${getAdminNavGroupToggleClasses(mode)} shrink-0`;
          return (
            <div
              className={`shrink-0 border-b border-admin-flesh/10 transition-[padding] duration-200 ${
                sidebarRailCollapsed ? 'px-1.5 py-2' : 'px-1.5 pb-2.5 pt-2.5'
              }`}
            >
              <div
                className={
                  sidebarRailCollapsed
                    ? 'flex flex-col items-center gap-2'
                    : 'flex flex-row items-center gap-1'
                }
              >
                <button
                  type="button"
                  onClick={() => router.push(logoTab.path)}
                  aria-label={t('home.header.logoAlt')}
                  title={sidebarRailCollapsed ? t('admin.menu.homePage') : undefined}
                  className={[
                    'flex min-w-0 justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-warm/45 focus-visible:ring-offset-2 focus-visible:ring-offset-admin-brand',
                    sidebarRailCollapsed
                      ? 'w-full max-w-full px-1 py-1 [&_img]:max-h-8 [&_img]:max-w-[4.25rem]'
                      : [
                          'min-h-0 flex-1 px-1 py-1',
                          '[&_img]:h-auto [&_img]:w-full [&_img]:max-w-none [&_img]:object-contain [&_img]:object-center',
                          '[&_img]:max-h-[5.75rem] sm:[&_img]:max-h-[6.75rem]',
                        ].join(' '),
                    logoActive ? 'bg-admin-warm/25 ring-1 ring-admin-warm/40' : 'hover:bg-black/10',
                  ].join(' ')}
                >
                  {logoTab.icon}
                </button>
                <button
                  type="button"
                  onClick={onToggleSidebarRail}
                  aria-expanded={railWide}
                  aria-label={sidebarRailCollapsed ? sidebarRailExpandLabel : sidebarRailCollapseLabel}
                  title={sidebarRailCollapsed ? sidebarRailExpandLabel : sidebarRailCollapseLabel}
                  className={
                    sidebarRailCollapsed
                      ? `${railToggleClass} !w-full !justify-center !px-0`
                      : railToggleClass
                  }
                >
                  {sidebarRailCollapsed ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 19l-7-7 7-7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })()}
        <nav
          className={`admin-sidebar-scroll flex min-h-0 flex-1 flex-col overflow-y-auto ${getAdminNavContainerClass(mode)}`}
        >
          {adminTabs.map((tab) => {
            if (tab.isSiteLogoNav) {
              return null;
            }
            if (tab.navCollapsibleChildOf === 'products' && !productSubnavExpanded) {
              return null;
            }

            const isActive = isAdminMenuItemActive(tab.path, currentPath);
            const isProductsParent = tab.navCollapsibleParentId === 'products';

            if (isProductsParent) {
              const linkClassWide = `${getAdminNavLinkButtonClasses(mode, isActive, false).replace('w-full', 'min-w-0 flex-1')} ${collapsedBtn}`;
              const linkClassRail = `${getAdminNavLinkButtonClasses(mode, isActive, false)} ${collapsedBtn}`;
              const chevronButton = (
                <button
                  type="button"
                  className={
                    sidebarRailCollapsed
                      ? `${getAdminNavGroupToggleClasses(mode)} absolute right-0 top-1/2 z-10 -translate-y-1/2 !px-1`
                      : getAdminNavGroupToggleClasses(mode)
                  }
                  aria-expanded={productSubnavExpanded}
                  aria-label={toggleProductsSubnavAriaLabel}
                  title={sidebarRailCollapsed ? toggleProductsSubnavAriaLabel : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    onProductSubnavToggle();
                  }}
                >
                  <svg
                    className={`h-4 w-4 transition-transform ${productSubnavExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );

              if (sidebarRailCollapsed) {
                return (
                  <div key={tab.id} className="relative w-full">
                    <button
                      type="button"
                      onClick={() => {
                        router.push(tab.path);
                      }}
                      className={linkClassRail}
                      aria-label={tab.label}
                      title={tab.label}
                    >
                      <span className={getAdminNavIconClass(mode, isActive)}>{tab.icon}</span>
                      <span className="sr-only">{tab.label}</span>
                    </button>
                    {chevronButton}
                  </div>
                );
              }

              return (
                <div key={tab.id} className="flex w-full items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      router.push(tab.path);
                    }}
                    className={linkClassWide}
                  >
                    <span className={getAdminNavIconClass(mode, isActive)}>{tab.icon}</span>
                    <span className="truncate text-left">{tab.label}</span>
                  </button>
                  {chevronButton}
                </div>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  router.push(tab.path);
                }}
                className={`${getAdminNavLinkButtonClasses(mode, isActive, Boolean(tab.isSubCategory))} ${collapsedBtn}`}
                aria-label={sidebarRailCollapsed ? tab.label : undefined}
                title={sidebarRailCollapsed ? tab.label : undefined}
              >
                <span className={getAdminNavIconClass(mode, isActive)}>{tab.icon}</span>
                <span className={sidebarRailCollapsed ? 'sr-only' : 'text-left'}>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
