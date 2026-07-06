import { ProductsPageShell } from '@/lib/products/products-page-shared';

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return <ProductsPageShell searchParams={searchParams} />;
}
