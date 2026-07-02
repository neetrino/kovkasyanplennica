import type { LanguageCode } from '@/lib/language';
import { toCatalogCardProduct } from './catalog-card-product';
import { CatalogProductCardShell } from './CatalogProductCardShell';
import {
  ProductsCategoryExpandControls,
  type CategoryRowFilterParams,
} from './ProductsCategoryExpandControls';

type CategoryRowSourceProduct = Parameters<typeof toCatalogCardProduct>[0];

type ProductsCategoryRowProps = {
  rowProducts: CategoryRowSourceProduct[];
  totalInRow: number;
  categorySlug: string;
  sortBy: string;
  lang: LanguageCode;
  filterParams: CategoryRowFilterParams;
  initialProductCount: number;
  minVisibleCards?: number;
};

export function ProductsCategoryRow({
  rowProducts,
  totalInRow,
  categorySlug,
  sortBy,
  lang,
  filterParams,
  initialProductCount,
  minVisibleCards,
}: ProductsCategoryRowProps) {
  const initialProducts = rowProducts
    .slice(0, initialProductCount)
    .map(toCatalogCardProduct);

  const serverShellCount = Math.min(
    initialProducts.length,
    minVisibleCards ?? 2
  );
  const serverShellProducts = initialProducts.slice(0, serverShellCount);

  const initialProductsForControls = initialProducts.map(({ id, price, title, slug }) => ({
    id,
    price,
    title,
    slug,
  }));

  return (
    <ProductsCategoryExpandControls
      initialProducts={initialProductsForControls}
      serverShellCount={serverShellProducts.length}
      totalInRow={totalInRow}
      categorySlug={categorySlug}
      sortBy={sortBy}
      lang={lang}
      filterParams={filterParams}
      minVisibleCards={minVisibleCards}
    >
      {serverShellProducts.map((product) => (
        <CatalogProductCardShell
          key={product.id}
          product={product}
          locale={lang}
        />
      ))}
    </ProductsCategoryExpandControls>
  );
}
