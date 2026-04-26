'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { canAccessAdminPath, resolveAdminDefaultPath } from '@/lib/auth/roles';
import { AdminNavThemeProvider } from '@/components/admin/AdminNavThemeContext';
import { AdminNavThemeToggle } from '@/components/admin/AdminNavThemeToggle';

export function AdminLayoutShell({ children }: { children: ReactNode }) {
  const { isLoading, isLoggedIn, roles } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

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

  return (
    <AdminNavThemeProvider>
      <div className="box-border ml-4 flex min-h-0 w-[calc(100%-1rem)] flex-col border border-gray-200">
        <div className="flex shrink-0 items-center justify-end gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <AdminNavThemeToggle />
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </AdminNavThemeProvider>
  );
}
