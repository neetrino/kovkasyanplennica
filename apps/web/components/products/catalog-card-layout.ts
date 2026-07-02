import type { CatalogCardProduct } from './catalog-card-product';

export function getCatalogProductHref(slug: string): string {
  const normalizedSlug = slug.trim();
  return normalizedSlug ? `/products/${encodeURIComponent(normalizedSlug)}` : '/products';
}

export function getCatalogCategoryLabel(product: CatalogCardProduct, fallback: string): string {
  return product.category || product.brandName || fallback;
}

export const CATALOG_CARD_SHELL_CLASS =
  'relative flex h-full w-full flex-col overflow-visible rounded-[35px] bg-white shadow-[15px_15px_15px_0px_rgba(0,0,0,0.08)] group min-h-[158px] md:min-h-[208px]';

export const CATALOG_CARD_IMAGE_WRAP_CLASS =
  'absolute top-0 left-1/2 z-10 aspect-square w-[54%] origin-center -translate-x-1/2 -translate-y-[50%] transition-transform duration-700 ease-in-out md:w-[46%] lg:group-hover:z-20 lg:group-hover:scale-[1.5]';

export const CATALOG_CARD_INFO_WRAP_CLASS =
  'relative z-20 flex flex-1 flex-col px-[6.17%] pt-[18%] pb-[3%] md:pt-[15%] md:pb-[6%]';

export const CATALOG_CARD_TITLE_CLASS =
  'mb-1 min-h-[34px] text-center text-[14px] font-bold leading-[17px] text-black md:mb-2 md:min-h-[48px] md:text-[18px] md:leading-[24px]';

export const CATALOG_CARD_PRICE_ROW_CLASS =
  'relative mt-4 flex items-center justify-between pt-2 pb-2 md:mt-auto md:pt-6 md:pb-5';

export const CATALOG_CARD_GRID_CELL_CLASS =
  'min-w-0 px-0 pb-2 pt-3 sm:px-2 sm:pb-4 sm:pt-4 md:px-2.5 md:pb-10 md:pt-0';
