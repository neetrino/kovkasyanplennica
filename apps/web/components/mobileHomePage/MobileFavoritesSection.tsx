import { MobileFavorites } from './MobileFavorites';
import { t } from '../../lib/i18n';
import { getStoredLanguage } from '../../lib/language';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  inStock: boolean;
  brand: { id: string; name: string } | null;
  calories?: number;
  category?: string;
  labels?: unknown[];
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  colors?: unknown[];
}

interface ProductsResponse {
  data: Product[];
}

async function getFavoriteProducts(limit: number = 8): Promise<Product[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const params = new URLSearchParams({ page: '1', limit: limit.toString(), lang: 'en' });
    const res = await fetch(`${baseUrl}/api/v1/products?${params}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const response: ProductsResponse = await res.json();
    if (!response.data || !Array.isArray(response.data)) return [];
    const lang = getStoredLanguage() || 'en';
    const categoryFallback = t(lang, 'home.menu.categoryFallback');
    return response.data.map((p: Record<string, unknown>) => ({
      id: String(p.id),
      slug: String(p.slug ?? ''),
      title: String(p.title ?? ''),
      price: Number(p.price ?? 0),
      image: (p.image as string) ?? null,
      inStock: Boolean(p.inStock ?? true),
      brand: (p.brand as Product['brand']) ?? null,
      calories: Number(p.calories ?? 150),
      category: (p.brand as { name?: string })?.name ?? String(p.category ?? categoryFallback),
      labels: (p.labels as Product['labels']) ?? [],
      compareAtPrice: (p.compareAtPrice as number | null) ?? null,
      originalPrice: (p.originalPrice as number | null) ?? null,
      discountPercent: (p.discountPercent as number | null) ?? null,
      colors: (p.colors as Product['colors']) ?? [],
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
