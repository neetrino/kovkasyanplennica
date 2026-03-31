import { MobileMenuClient } from './MobileMenuClient';
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
  brand: { id: string; name: string } | null;
  calories?: number;
  category?: string;
  labels?: Array<{
    id: string;
    type: 'text' | 'percentage';
    value: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    color: string | null;
  }>;
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
}

async function getMenuProducts(
  page: number = 1,
  limit: number = 4
): Promise<{ products: Product[]; totalPages: number }> {
  try {
    const lang = getStoredLanguage() || 'ru';
    const result = await productsService.findAll({ page, limit, lang });
    if (!result.data || !Array.isArray(result.data)) return { products: [], totalPages: 0 };
    const categoryFallback = t(lang, 'home.menu.categoryFallback');
    const products = result.data.map((p: any) => ({
      id: String(p.id),
      slug: String(p.slug ?? ''),
      title: String(p.title ?? ''),
      price: Number(p.price ?? 0),
      image: p.image ?? null,
      inStock: Boolean(p.inStock ?? true),
      brand: p.brand ?? null,
      calories: Number(p.calories ?? 150),
      category: (p.brand?.name ?? p.category ?? categoryFallback) as string,
      labels: p.labels ?? [],
      compareAtPrice: p.compareAtPrice ?? null,
      originalPrice: p.originalPrice ?? null,
      discountPercent: p.discountPercent ?? null,
      colors: p.colors ?? [],
    }));
    return { products, totalPages: result.meta?.totalPages ?? 0 };
  } catch {
    return { products: [], totalPages: 0 };
  }
}

export async function MobileMenuSection() {
  const { products, totalPages } = await getMenuProducts(1, 2);
  return (
    <section className="relative bg-[#2f3f3d] rounded-t-[46px] -mt-[26px] pt-8 pb-12 min-h-[600px]">
      <MobileMenuClient initialItems={products} totalPages={totalPages} />
    </section>
  );
}
