'use client';

import type { ReactNode } from 'react';
import { AdminNavThemeProvider } from '@/components/admin/AdminNavThemeContext';
import { AdminNavThemeToggle } from '@/components/admin/AdminNavThemeToggle';

export function AdminLayoutShell({ children }: { children: ReactNode }) {
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
