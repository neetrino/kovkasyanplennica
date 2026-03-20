/** Contact page uses client hooks; disable static prerender to avoid "useState of null" during build. */
export const dynamic = 'force-dynamic';

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
