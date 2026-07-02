import {
  apiListingToCatalogCardProduct,
  type CatalogCardProduct,
} from './catalog-card-product';
import { CATEGORY_ROW_EXPAND_LIMIT } from './shop-listing-limits';

export type CategoryRowFetchFilters = {
  categorySlug: string;
  lang: string;
  sort?: string;
  search?: string;
  colors?: string;
  sizes?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
};

type ProductsApiResponse = {
  data?: ApiListingProduct[];
};

type ApiListingProduct = Parameters<typeof apiListingToCatalogCardProduct>[0];

export async function fetchCategoryRowProducts(
  filters: CategoryRowFetchFilters
): Promise<CatalogCardProduct[]> {
  if (filters.categorySlug === '__other__') {
    return [];
  }

  const params = new URLSearchParams();
  params.set('page', '1');
  params.set('limit', String(CATEGORY_ROW_EXPAND_LIMIT));
  params.set('lang', filters.lang);
  params.set('category', filters.categorySlug);

  if (filters.sort?.trim()) {
    params.set('sort', filters.sort.trim());
  }
  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }
  if (filters.colors?.trim()) {
    params.set('colors', filters.colors.trim());
  }
  if (filters.sizes?.trim()) {
    params.set('sizes', filters.sizes.trim());
  }
  if (filters.brand?.trim()) {
    params.set('brand', filters.brand.trim());
  }
  if (filters.minPrice?.trim()) {
    params.set('minPrice', filters.minPrice.trim());
  }
  if (filters.maxPrice?.trim()) {
    params.set('maxPrice', filters.maxPrice.trim());
  }

  const response = await fetch(`/api/v1/products?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Category row fetch failed: ${response.status}`);
  }

  const json = (await response.json()) as ProductsApiResponse;
  if (!json.data || !Array.isArray(json.data)) {
    return [];
  }

  return json.data.map(apiListingToCatalogCardProduct);
}
