import { MobileFavorites } from './MobileFavorites';
import { t } from '../../lib/i18n';
import { getStoredLanguage } from '../../lib/language';
import { productsService } from '../../lib/services/products.service';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  inStock: boolean;
  defaultVariantId?: string | null;
  stock?: number;
  brand: { id: string; name: string } | null;
  calories?: number;
  category?: string;
  labels?: unknown[];
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  colors?: unknown[];
}

async function getFavoriteProducts(limit: number = 8): Promise<Product[]> {
  try {
    const lang = getStoredLanguage() || 'ru';
    const result = await productsService.findAll({ page: 1, limit, lang });
    if (!result.data || !Array.isArray(result.data)) return [];
    const categoryFallback = t(lang, 'home.menu.categoryFallback');
    return result.data.map((p: any) => ({
      id: String(p.id),
      slug: String(p.slug ?? ''),
      title: String(p.title ?? ''),
      price: Number(p.price ?? 0),
      image: p.image ?? null,
      inStock: Boolean(p.inStock ?? true),
      defaultVariantId: p.defaultVariantId ?? null,
      stock: typeof p.stock === 'number' ? p.stock : undefined,
      brand: p.brand ?? null,
      calories: Number(p.calories ?? 150),
      category: (p.brand?.name ?? p.category ?? categoryFallback) as string,
      labels: p.labels ?? [],
      compareAtPrice: p.compareAtPrice ?? null,
      originalPrice: p.originalPrice ?? null,
      discountPercent: p.discountPercent ?? null,
      colors: p.colors ?? [],
    }));
  } catch {
    return [];
  }
}

export async function MobileFavoritesSection() {
  const products = await getFavoriteProducts(4);
  return (
    <section className="relative z-10 bg-[#2f3f3d] rounded-t-[46px] -mt-[26px] pt-8 pb-12 min-h-[800px] overflow-hidden">
      <MobileFavorites items={products} />
    </section>
  );
}
