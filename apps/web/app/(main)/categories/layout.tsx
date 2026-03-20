/** Page uses client hooks (useState, useEffect). Disable static prerender to avoid "useState of null" during build. */
export const dynamic = 'force-dynamic';

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
