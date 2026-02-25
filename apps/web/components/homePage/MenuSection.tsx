import { MenuClient } from './MenuClient';
import { t } from '../../lib/i18n';
import { getStoredLanguage } from '../../lib/language';

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

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Fetch products for Menu section
 */
async function getMenuProducts(page: number = 1, limit: number = 4): Promise<{ products: Product[]; totalPages: number }> {
  try {
    // Use default language 'en' for now
    const language = 'en';

    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
      lang: language,
    };

    const queryString = new URLSearchParams(params).toString();

    // Fallback chain: NEXT_PUBLIC_APP_URL -> VERCEL_URL -> localhost (for local dev)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const targetUrl = `${baseUrl}/api/v1/products?${queryString}`;
    console.log("🌐 [MENU SECTION] Fetch products", { targetUrl, baseUrl, page, limit });

    const res = await fetch(targetUrl, {
      cache: "no-store"
    });

    if (!res.ok) {
      console.error("❌ [MENU SECTION] API failed:", res.status);
      return { products: [], totalPages: 0 };
    }

    const response: ProductsResponse = await res.json();
    if (!response.data || !Array.isArray(response.data)) {
      return { products: [], totalPages: 0 };
    }

    // Normalize products
    const lang = getStoredLanguage() || 'en';
    const categoryFallback = t(lang, 'home.menu.categoryFallback');
    const products = response.data.map((p: any) => ({
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

    return {
      products,
      totalPages: response.meta?.totalPages || 0,
    };

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
