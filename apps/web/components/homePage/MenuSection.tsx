import { MenuClient } from './MenuClient';
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
  brand: {
    id: string;
    name: string;
  } | null;
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
  globalDiscount?: number | null;
  discountPercent?: number | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
}

/**
 * Fetch products for Menu section directly via service (no HTTP self-call).
 */
async function getMenuProducts(page: number = 1, limit: number = 4): Promise<{ products: Product[]; totalPages: number }> {
  try {
    const lang = getStoredLanguage() || 'en';
    const result = await productsService.findAll({ page, limit, lang });

    if (!result.data || !Array.isArray(result.data)) {
      return { products: [], totalPages: 0 };
    }

    const categoryFallback = t(lang, 'home.menu.categoryFallback');
    const products = result.data.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? p.originalPrice ?? null,
      image: p.image ?? null,
      inStock: p.inStock ?? true,
      brand: p.brand ?? null,
      colors: p.colors ?? [],
      labels: p.labels ?? [],
      calories: p.calories ?? Math.floor(Math.random() * 200) + 100,
      category: p.brand?.name || p.category || categoryFallback,
    }));

    return { products, totalPages: result.meta?.totalPages || 0 };
  } catch (e) {
    console.error("❌ [MENU SECTION] Error fetching products:", e);
    return { products: [], totalPages: 0 };
  }
}

/**
 * Menu Section Server Component
 * Fetches real products and passes them to MenuClient component
 */
export async function MenuSection() {
  const { products, totalPages } = await getMenuProducts(1, 4);

  return (
    <section className="relative bg-[#2f3f3d] overflow-hidden min-h-[1000px] py-16 md:py-24 rounded-t-[37px] -mt-[26px] z-10">
      <MenuClient initialItems={products} totalPages={totalPages} />
    </section>
  );
}
