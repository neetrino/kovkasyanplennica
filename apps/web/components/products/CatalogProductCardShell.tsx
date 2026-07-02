import Image from 'next/image';
import Link from 'next/link';
import type { LanguageCode } from '@/lib/language';
import { t } from '@/lib/i18n';
import type { CatalogCardProduct } from './catalog-card-product';
import {
  CATALOG_CARD_IMAGE_WRAP_CLASS,
  CATALOG_CARD_INFO_WRAP_CLASS,
  CATALOG_CARD_PRICE_ROW_CLASS,
  CATALOG_CARD_SHELL_CLASS,
  CATALOG_CARD_TITLE_CLASS,
  getCatalogCategoryLabel,
  getCatalogProductHref,
} from './catalog-card-layout';
import { ProductCardCatalogIslands } from './ProductCardCatalogIslands';

type CatalogProductCardShellProps = {
  product: CatalogCardProduct;
  locale: LanguageCode;
};

export function CatalogProductCardShell({ product, locale }: CatalogProductCardShellProps) {
  const productHref = getCatalogProductHref(product.slug);
  const categoryLabel = getCatalogCategoryLabel(
    product,
    t(locale, 'common.defaults.category')
  );
  const description = product.description?.trim();

  return (
    <div className={CATALOG_CARD_SHELL_CLASS}>
      <Link
        href={productHref}
        prefetch={false}
        className="absolute inset-0 z-[1] rounded-[35px] outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        aria-label={`${product.title} — view product`}
      />
      <div className="pointer-events-none relative z-[2] flex h-full w-full flex-col">
        <div className={CATALOG_CARD_IMAGE_WRAP_CLASS}>
          <div className="relative block h-full w-full bg-transparent">
            {product.image ? (
              <Image
                src={product.image}
                alt=""
                fill
                className="object-contain transition-transform duration-700 ease-in-out lg:group-hover:rotate-[30deg]"
                sizes="(max-width: 768px) min(60vw, 280px), 200px"
                aria-hidden
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-full bg-gray-200"
                aria-hidden
              >
                <svg
                  className="h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className={CATALOG_CARD_INFO_WRAP_CLASS}>
          <h3
            className={CATALOG_CARD_TITLE_CLASS}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.title}
          </h3>

          {description ? (
            <p className="mb-1 text-center text-[12px] font-semibold leading-normal text-[#acacac] md:mb-2 md:text-[15px]">
              {description}
            </p>
          ) : null}

          <div className="mx-auto mb-1 w-full border-t border-[rgba(172,172,172,0.2)] md:mb-2" />

          <div className="mb-1 flex items-center justify-between gap-2 md:mb-2">
            <span className="text-[12px] font-medium leading-normal text-[#5c5c5c] md:text-[15px]">
              {t(locale, 'common.navigation.categories')}
            </span>
            <p
              className="truncate text-right text-[12px] font-medium leading-normal text-[#acacac] md:text-[15px]"
              title={categoryLabel}
            >
              {categoryLabel}
            </p>
          </div>

          <div className={CATALOG_CARD_PRICE_ROW_CLASS}>
            <span className="whitespace-pre-wrap text-[12px] font-medium leading-normal text-[#5c5c5c] md:text-[15px]">
              {t(locale, 'common.price')}
            </span>
            <ProductCardCatalogIslands
              productId={product.id}
              slug={product.slug}
              title={product.title}
              image={product.image}
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              defaultVariantId={product.defaultVariantId}
              stock={product.stock}
              inStock={product.inStock}
              discountPercent={product.discountPercent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
