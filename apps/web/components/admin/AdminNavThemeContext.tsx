'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'kovka-admin-nav-dark';

/** Նախնական և fallback արժեք՝ մուգ մենյու (light միայն եթե պահված է `0`)։ */
export const DEFAULT_ADMIN_NAV_MENU_DARK = true;

export interface AdminNavThemeContextValue {
  /** When `false`, sidebar / drawer use light styling. */
  isDark: boolean;
  setDark: (value: boolean) => void;
}

const AdminNavThemeContext = createContext<AdminNavThemeContextValue | null>(null);

export function AdminNavThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDarkState] = useState(DEFAULT_ADMIN_NAV_MENU_DARK);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === '0') {
        setIsDarkState(false);
        return;
      }
      setIsDarkState(true);
      if (stored !== '1') {
        localStorage.setItem(STORAGE_KEY, '1');
      }
    } catch {
      setIsDarkState(DEFAULT_ADMIN_NAV_MENU_DARK);
    }
  }, []);

  const setDark = useCallback((value: boolean) => {
    setIsDarkState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ isDark, setDark }), [isDark, setDark]);

  return (
    <AdminNavThemeContext.Provider value={value}>{children}</AdminNavThemeContext.Provider>
  );
}

export function useAdminNavTheme(): AdminNavThemeContextValue {
  const ctx = useContext(AdminNavThemeContext);
  if (!ctx) {
    return { isDark: DEFAULT_ADMIN_NAV_MENU_DARK, setDark: () => {} };
  }
  return ctx;
}
