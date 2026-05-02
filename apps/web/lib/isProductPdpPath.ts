import { RESERVED_ROUTES } from '@/app/(main)/products/[slug]/types';

/**
 * True for `/products/{slug}` product detail URLs, excluding reserved slugs
 * that map to other app routes.
 */
export function isProductPdpPath(pathname: string | null): boolean {
  if (!pathname || !pathname.startsWith('/products/')) {
    return false;
  }
  const rest = pathname.slice('/products/'.length);
  const segment = rest.split('/')[0];
  if (!segment) {
    return false;
  }
  let slug: string;
  try {
    slug = decodeURIComponent(segment);
  } catch {
    slug = segment;
  }
  return !RESERVED_ROUTES.includes(slug.toLowerCase());
}
