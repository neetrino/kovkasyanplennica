import Link from 'next/link';
import { getStoredLanguage } from '../../lib/language';
import { productsService } from '../../lib/services/products.service';
import { MobileRecipeProductCard } from './MobileRecipeProductCard';

const NEW_ARRIVALS_LIMIT = 12;

const CAROUSEL_ROW =
  '-mr-4 flex gap-4 overflow-x-auto pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

/** Prefer `filter: new` (last 30 days); if none, show latest products. */
type ListProduct = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  defaultVariantId: string | null;
  inStock: boolean;
  stock: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
};

async function getNewArrivalsProducts(limit: number): Promise<ListProduct[]> {
  const lang = getStoredLanguage() || 'ru';
  try {
    const primary = await productsService.findAll({
      page: 1,
      limit,
      lang,
      filter: 'new',
    });
    let rows = primary.data && Array.isArray(primary.data) ? primary.data : [];
    if (rows.length === 0) {
      const latest = await productsService.findAll({ page: 1, limit, lang });
      rows = latest.data && Array.isArray(latest.data) ? latest.data : [];
    }
    return rows.map(
      (p: {
        id: unknown;
        slug?: unknown;
        title?: unknown;
        image?: string | null;
        price?: unknown;
        defaultVariantId?: string | null;
        stock?: unknown;
        inStock?: unknown;
        originalPrice?: number | null;
        compareAtPrice?: number | null;
      }) => ({
        id: String(p.id),
        slug: String(p.slug ?? ''),
        title: String(p.title ?? ''),
        image: p.image ?? null,
        price: typeof p.price === 'number' && !Number.isNaN(p.price) ? p.price : 0,
        defaultVariantId: p.defaultVariantId ?? null,
        stock: typeof p.stock === 'number' && !Number.isNaN(p.stock) ? p.stock : 0,
        inStock: Boolean(p.inStock),
        originalPrice: p.originalPrice ?? null,
        compareAtPrice: p.compareAtPrice ?? null,
      }),
    );
  } catch {
    return [];
  }
}

function splitIntoTwoCarouselRows<T>(items: T[]): [T[], T[]] {
  if (items.length === 0) return [[], []];
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

export async function MobileNewArrivalsSection() {
  const products = await getNewArrivalsProducts(NEW_ARRIVALS_LIMIT);
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
