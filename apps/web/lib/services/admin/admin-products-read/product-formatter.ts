const ADMIN_PRODUCT_LOCALES = ['ru', 'en', 'hy'] as const;

function pickTranslation<T extends { locale: string; title?: string | null }>(
  translations: T[] | undefined
): T | null {
  if (!Array.isArray(translations) || translations.length === 0) {
    return null;
  }

  for (const locale of ADMIN_PRODUCT_LOCALES) {
    const match = translations.find((item) => item.locale === locale);
    if (match?.title) {
      return match;
    }
  }

  return translations.find((item) => item.title) ?? translations[0] ?? null;
}

/**
 * Format product for list response
 */
export function formatProductForList(product: {
  id: string;
  published: boolean;
  featured: boolean | null;
  discountPercent: number | null;
  createdAt: Date;
  translations?: Array<{
    locale: string;
    slug: string;
    title: string;
  }>;
  variants?: Array<{
    price: number;
    stock: number;
    compareAtPrice: number | null;
  }>;
  media?: unknown[];
  categories?: Array<{
    translations?: Array<{ locale: string; title: string; slug: string }>;
  }>;
}) {
  const translation = pickTranslation(product.translations);
  // Безопасное получение variant с проверкой на существование массива
  const variant = Array.isArray(product.variants) && product.variants.length > 0
    ? product.variants[0]
    : null;
  
  const image = extractImageFromMedia(product.media);

  const categoryItems = Array.isArray(product.categories)
    ? product.categories
        .map((cat) => {
          const t = pickTranslation(cat.translations);
          if (!t || t.title == null) return null;
          return { title: t.title, slug: typeof t.slug === 'string' ? t.slug : '' };
        })
        .filter((item): item is { title: string; slug: string } => item != null)
    : [];

  return {
    id: product.id,
    slug: translation?.slug || "",
    title: translation?.title || "",
    published: product.published,
    featured: product.featured || false,
    price: variant?.price || 0,
    stock: variant?.stock || 0,
    discountPercent: product.discountPercent || 0,
    compareAtPrice: variant?.compareAtPrice || null,
    colorStocks: [], // Can be enhanced later
    image,
    createdAt: product.createdAt.toISOString(),
    categoryItems,
  };
}

/**
 * Extract image from media array
 */
function extractImageFromMedia(media: unknown[] | undefined): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }

  const firstMedia = media[0];
  
  if (typeof firstMedia === "string") {
    return firstMedia;
  }
  
  if (firstMedia && typeof firstMedia === "object" && "url" in firstMedia) {
    const mediaObj = firstMedia as { url?: string };
    return mediaObj.url || null;
  }

  return null;
}








