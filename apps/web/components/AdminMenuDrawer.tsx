'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminDrawerChevronClass,
  getAdminDrawerChromeClasses,
  getAdminDrawerRowClasses,
  getAdminNavIconClass,
} from '@/components/admin/adminNavClasses';
import { isAdminMenuItemActive } from '@/components/admin/isAdminMenuItemActive';
import type { AdminNavThemeMode } from '@/components/admin/adminNavClasses';
import { useAdminNavTheme } from '@/components/admin/AdminNavThemeContext';
import { useTranslation } from '@/lib/i18n-client';

export interface AdminMenuItem {
  id: string;
  label: string;
  path: string;
  icon: ReactNode;
  isSubCategory?: boolean;
  /** Row that toggles visibility of items with the same `navCollapsibleChildOf` id (e.g. «Товары»). */
  navCollapsibleParentId?: string;
  /** Nested under `navCollapsibleParentId`; hidden when that group is collapsed. */
  navCollapsibleChildOf?: string;
  /** Storefront logo row to `/` (no visible `label`; use `aria-label` in UI). */
  isSiteLogoNav?: boolean;
}

interface AdminMenuDrawerProps {
  tabs: AdminMenuItem[];
  currentPath: string;
  productSubnavExpanded: boolean;
  onProductSubnavToggle: () => void;
  toggleProductsSubnavAriaLabel: string;
}

/**
 * Renders a mobile-friendly admin hamburger menu that mirrors the desktop sidebar.
 */
export function AdminMenuDrawer({
  tabs,
  currentPath,
  productSubnavExpanded,
  onProductSubnavToggle,
  toggleProductsSubnavAriaLabel,
}: AdminMenuDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { isDark } = useAdminNavTheme();
  const mode: AdminNavThemeMode = isDark ? 'dark' : 'light';
  const chrome = getAdminDrawerChromeClasses(mode);
  const logoTab = tabs.find((tab) => tab.isSiteLogoNav);
  const logoActive = logoTab ? isAdminMenuItemActive(logoTab.path, currentPath) : false;

  // Scroll is allowed when drawer is open (no body overflow lock).

  /**
   * Handles navigation button clicks inside the drawer.
   */
  const handleNavigate = (path: string) => {
    console.info('[AdminMenuDrawer] Navigating to admin path', { path });
    router.push(path);
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => {
          console.info('[AdminMenuDrawer] Toggling drawer', { open: !open });
          setOpen(true);
        }}
        className={chrome.menuTrigger}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6H20M4 12H16M4 18H12" />
        </svg>
        Menu
      </button>

      {open && (
        <div
          className="fixed inset-0 z-app-modal flex bg-admin-brand/45 backdrop-blur-sm"
          onClick={() => {
            console.info('[AdminMenuDrawer] Closing drawer from backdrop');
            setOpen(false);
          }}
        >
          <div
            className={chrome.panel}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={chrome.headerRow}>
              <p className={chrome.headerTitle}>Admin Navigation</p>
              <button
                type="button"
                onClick={() => {
                  console.info('[AdminMenuDrawer] Closing drawer from close button');
                  setOpen(false);
                }}
                className={chrome.closeButton}
                aria-label="Close admin menu"
              >
                <svg className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {logoTab ? (
              <div className="border-b border-admin-brand px-4 py-4">
                <button
                  type="button"
                  onClick={() => handleNavigate(logoTab.path)}
                  aria-label={t('home.header.logoAlt')}
                  className={[
                    'mx-auto flex w-full max-w-full justify-center rounded-lg px-2 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-warm/45 focus-visible:ring-offset-2 focus-visible:ring-offset-admin-brand-2',
                    logoActive ? 'bg-admin-warm/20 ring-1 ring-admin-warm/35' : 'hover:bg-black/10',
                  ].join(' ')}
                >
                  {logoTab.icon}
                </button>
              </div>
            ) : null}

            <div className={`${chrome.listDivide} admin-sidebar-scroll`}>
              {tabs.map((tab) => {
                if (tab.isSiteLogoNav) {
                  return null;
                }
                if (tab.navCollapsibleChildOf === 'products' && !productSubnavExpanded) {
                  return null;
                }

                const isActive = isAdminMenuItemActive(tab.path, currentPath);
                const isProductsParent = tab.navCollapsibleParentId === 'products';

                if (isProductsParent) {
                  const rowBase = getAdminDrawerRowClasses(mode, isActive, false);
                  return (
                    <div key={tab.id} className="flex w-full items-stretch">
                      <button
                        type="button"
                        onClick={() => handleNavigate(tab.path)}
                        className={rowBase.replace('justify-between', 'justify-start').replace('w-full', 'min-w-0 flex-1')}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className={getAdminNavIconClass(mode, isActive)}>{tab.icon}</span>
                          <span className="truncate">{tab.label}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={rowBase.replace('justify-between', 'justify-center').replace('w-full', 'shrink-0 px-2')}
                        aria-expanded={productSubnavExpanded}
                        aria-label={toggleProductsSubnavAriaLabel}
                        onClick={(e) => {
                          e.preventDefault();
                          onProductSubnavToggle();
                        }}
                      >
                        <svg
                          className={`h-4 w-4 transition-transform ${productSubnavExpanded ? 'rotate-90' : ''} ${getAdminDrawerChevronClass(mode, isActive)}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleNavigate(tab.path)}
                    className={getAdminDrawerRowClasses(mode, isActive, Boolean(tab.isSubCategory))}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className={getAdminNavIconClass(mode, isActive)}>{tab.icon}</span>
                      {tab.label}
                    </span>
                    <svg className={getAdminDrawerChevronClass(mode, isActive)} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


