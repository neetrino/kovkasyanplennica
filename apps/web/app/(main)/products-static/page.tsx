import { PUBLIC_PAGE_REVALIDATE_SECONDS } from '@/lib/cache/public-cache-ttl';
import { ProductsPageShell } from '@/lib/products/products-page-shared';

/** ISR — bare /products (rewritten from proxy when query string is empty). */
export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export default function ProductsStaticPage() {
  return <ProductsPageShell defaultDecorativeBackground />;
}
