import { categoriesService } from '@/lib/services/categories.service';
import { getStoredLanguage } from '@/lib/language';
import { productsService } from '@/lib/services/products.service';

export type MobileTopProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
};

export type MobileCategoryChipNode = {
  id: string;
  slug: string;
  title: string;
  children: MobileCategoryChipNode[];
};

/**
 * Featured carousel for mobile home «Топ» block.
 */
export async function getMobileFeaturedTopProducts(limit: number): Promise<MobileTopProduct[]> {
  try {
    const lang = getStoredLanguage() || 'ru';
    const result = await productsService.findAll({
      page: 1,
      limit,
      lang,
      filter: 'featured',
    });
    if (!result.data || !Array.isArray(result.data)) return [];
    return result.data.slice(0, limit).map(
      (p: {
        id: string;
        slug?: string;
        title?: string;
        price?: number;
        image?: string | null;
      }) => ({
        id: String(p.id),
        slug: String(p.slug ?? ''),
        title: String(p.title ?? ''),
        price: Number(p.price ?? 0),
        image: p.image ?? null,
      }),
    );
  } catch {
    return [];
  }
}

/**
 * Root category tree for horizontal chips on mobile home.
 */
export async function getMobileRootCategories(): Promise<MobileCategoryChipNode[]> {
  try {
    const lang = getStoredLanguage() || 'ru';
    const result = await categoriesService.getTree(lang);
    const data = result.data;
    return Array.isArray(data) ? (data as MobileCategoryChipNode[]) : [];
  } catch {
    return [];
  }
}
