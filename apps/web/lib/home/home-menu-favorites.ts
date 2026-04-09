import { unstable_cache } from 'next/cache';
import { t } from '@/lib/i18n';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import { productsService } from '@/lib/services/products.service';

export const HOME_MENU_LIMIT = 4;
export const HOME_FAVORITES_LIMIT = 8;
export const HOME_MENU_MAX_PAGES = 4;

export type HomeSectionProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  inStock: boolean;
  defaultVariantId?: string | null;
  stock?: number;
  brand: {
    id: string;
    name: string;
  } | null;
  description?: string | null;
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
};

const HOME_PRODUCTS_REVALIDATE_SECONDS = 120;

function mapRawToHomeProduct(
  p: {
    id: string;
    slug: string;
    title: string;
    price: number;
    compareAtPrice?: number | null;
    originalPrice?: number | null;
    image?: string | null;
    inStock?: boolean;
    defaultVariantId?: string | null;
    stock?: number;
    brand?: HomeSectionProduct['brand'];
    category?: string;
    categories?: Array<{ title?: string | null }>;
    description?: string | null;
    colors?: HomeSectionProduct['colors'];
    labels?: HomeSectionProduct['labels'];
  },
  categoryFallback: string
): HomeSectionProduct {
  const primaryCategoryTitle = p.categories?.[0]?.title?.trim();

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? p.originalPrice ?? null,
    image: p.image ?? null,
    inStock: p.inStock ?? true,
    defaultVariantId: p.defaultVariantId ?? null,
    stock: typeof p.stock === 'number' ? p.stock : undefined,
    brand: p.brand ?? null,
    colors: p.colors ?? [],
    labels: p.labels ?? [],
    description: p.description ?? null,
    category: primaryCategoryTitle || p.category || categoryFallback,
  };
}

/**
 * Single DB read for menu (first N) + favorites (first M), cached with ISR.
 */
const fetchHomeProductsPageCached = unstable_cache(
  async (lang: LanguageCode) => {
    const result = await productsService.findAll({
      page: 1,
      limit: HOME_FAVORITES_LIMIT,
      lang,
    });

    if (!result.data || !Array.isArray(result.data)) {
      return { products: [] as HomeSectionProduct[], totalPages: 0 };
    }

    const categoryFallback = t(lang, 'home.menu.categoryFallback');
    const products = result.data.map((row) => mapRawToHomeProduct(row, categoryFallback));

    return {
      products,
      totalPages: result.meta?.totalPages ?? 0,
    };
  },
  ['home-menu-favorites-products-v2'],
  {
    revalidate: HOME_PRODUCTS_REVALIDATE_SECONDS,
    tags: ['home-menu-favorites'],
  }
);

export async function getHomeMenuAndFavoritesData(): Promise<{
  menuProducts: HomeSectionProduct[];
  favoritesProducts: HomeSectionProduct[];
  menuTotalPages: number;
}> {
  const lang: LanguageCode = getStoredLanguage() || 'ru';
  const { products, totalPages } = await fetchHomeProductsPageCached(lang);

  return {
    menuProducts: products.slice(0, HOME_MENU_LIMIT),
    favoritesProducts: products.slice(0, HOME_FAVORITES_LIMIT),
    menuTotalPages: Math.min(totalPages, HOME_MENU_MAX_PAGES),
  };
}
