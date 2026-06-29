import { redirect } from 'next/navigation';
import { DESKTOPS_ENABLED } from '@/lib/feature-flags';

type DesktopsLayoutProps = {
  children: React.ReactNode;
};

export default function DesktopsLayout({ children }: DesktopsLayoutProps) {
  if (!DESKTOPS_ENABLED) {
    redirect('/');
  }

  return children;
}
