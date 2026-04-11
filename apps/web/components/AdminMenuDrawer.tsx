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

export interface AdminMenuItem {
  id: string;
  label: string;
  path: string;
  icon: ReactNode;
  isSubCategory?: boolean;
}

interface AdminMenuDrawerProps {
  tabs: AdminMenuItem[];
  currentPath: string;
}

/**
 * Renders a mobile-friendly admin hamburger menu that mirrors the desktop sidebar.
 */
export function AdminMenuDrawer({ tabs, currentPath }: AdminMenuDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { isDark } = useAdminNavTheme();
  const mode: AdminNavThemeMode = isDark ? 'dark' : 'light';
  const chrome = getAdminDrawerChromeClasses(mode);

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
          className="fixed inset-0 z-app-modal flex bg-black/40 backdrop-blur-sm"
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

            <div className={chrome.listDivide}>
              {tabs.map((tab) => {
                const isActive = isAdminMenuItemActive(tab.path, currentPath);

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavigate(tab.path)}
                    className={getAdminDrawerRowClasses(mode, isActive, Boolean(tab.isSubCategory))}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className={getAdminNavIconClass(mode, isActive)}>{tab.icon}</span>
                      {tab.label}
                    </span>
                    <svg className={getAdminDrawerChevronClass(mode, isActive)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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


