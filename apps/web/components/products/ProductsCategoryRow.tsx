import type { LanguageCode } from '@/lib/language';
import { toCatalogCardProduct } from './catalog-card-product';
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

  return (
    <ProductsCategoryExpandControls
      initialProducts={initialProducts}
      totalInRow={totalInRow}
      categorySlug={categorySlug}
      sortBy={sortBy}
      lang={lang}
      filterParams={filterParams}
      minVisibleCards={minVisibleCards}
    />
  );
}
