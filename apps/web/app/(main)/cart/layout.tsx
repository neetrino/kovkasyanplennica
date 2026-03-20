/** Cart is client-only (useState, useEffect, useAuth). Disable static prerender to avoid "useState of null" during build. */
export const dynamic = 'force-dynamic';

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
