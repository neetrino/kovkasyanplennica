import { Favorites } from './Favorites';
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
 * Fetch products for Favorites section directly via service (no HTTP self-call).
 */
async function getFavoriteProducts(limit: number = 8): Promise<Product[]> {
  try {
    const lang = getStoredLanguage() || 'en';
    const result = await productsService.findAll({ page: 1, limit, lang });

    if (!result.data || !Array.isArray(result.data)) return [];

    const categoryFallback = t(lang, 'home.menu.categoryFallback');
    return result.data.map((p: any) => ({
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
  } catch (e) {
    console.error("❌ [FAVORITES SECTION] Error fetching products:", e);
    return [];
  }
}

/**
 * Favorites Section Server Component
 * Fetches real products and passes them to Favorites client component
 */
export async function FavoritesSection() {
  const products = await getFavoriteProducts(8);

  return <Favorites items={products} />;
}


