import type { ReactNode } from 'react';
import { AdminLayoutShell } from './AdminLayoutShell';

/** Admin շրջանակ, թեմայի provider + toggle (մուգ/բաց մենյու)։ */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
