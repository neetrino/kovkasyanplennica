import Link from 'next/link';
import type { MobileNewArrivalProduct } from '@/lib/home/mobile-new-arrivals';
import { MobileRecipeProductCard } from './MobileRecipeProductCard';

const CAROUSEL_ROW =
  '-mr-4 flex gap-4 overflow-x-auto pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

function splitIntoTwoCarouselRows<T>(items: T[]): [T[], T[]] {
  if (items.length === 0) return [[], []];
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

type MobileNewArrivalsSectionProps = {
  products: MobileNewArrivalProduct[];
};

export function MobileNewArrivalsSection({ products }: MobileNewArrivalsSectionProps) {
  const [firstRow, secondRow] = splitIntoTwoCarouselRows(products);

  return (
    <section className="mb-7">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-[16px] leading-[1.35]">Новинки</p>
        <Link href="/products" className="text-[16px] leading-[1.35] text-[#75bf5e]">
          Смотреть Все
        </Link>
      </div>
      {products.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className={CAROUSEL_ROW}>
            {firstRow.map((product) => (
              <MobileRecipeProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                title={product.title}
                imageSrc={product.image}
                price={product.price}
                defaultVariantId={product.defaultVariantId}
                inStock={product.inStock}
                stock={product.stock}
                originalPrice={product.originalPrice}
                compareAtPrice={product.compareAtPrice}
              />
            ))}
          </div>
          {secondRow.length > 0 ? (
            <div className={CAROUSEL_ROW}>
              {secondRow.map((product) => (
                <MobileRecipeProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  title={product.title}
                  imageSrc={product.image}
                  price={product.price}
                  defaultVariantId={product.defaultVariantId}
                  inStock={product.inStock}
                  stock={product.stock}
                  originalPrice={product.originalPrice}
                  compareAtPrice={product.compareAtPrice}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
