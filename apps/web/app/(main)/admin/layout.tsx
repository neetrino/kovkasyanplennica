import type { ReactNode } from 'react';
import { AdminLayoutShell } from './AdminLayoutShell';

/** Admin շրջանակ, նավիգացիայի թեմայի provider (localStorage)։ */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
