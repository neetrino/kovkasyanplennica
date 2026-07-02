/** Minimal product shape serialized from /products server page to client carousel/cards. */
export type CatalogCardProduct = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  inStock: boolean;
  defaultVariantId?: string | null;
  stock?: number;
  brandName?: string | null;
  category: string;
  description?: string;
};

type CatalogCardSource = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  compareAtPrice: number | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  image: string | null;
  inStock: boolean;
  defaultVariantId?: string | null;
  stock?: number;
  brand: { id: string; name: string } | null;
  category: string;
};

type ApiListingProduct = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  compareAtPrice: number | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  image: string | null;
  inStock: boolean;
  defaultVariantId?: string | null;
  stock?: number;
  brand: { id: string; name: string } | null;
  categories?: Array<{ title?: string }>;
};

export function toCatalogCardProduct(source: CatalogCardSource): CatalogCardProduct {
  const card: CatalogCardProduct = {
    id: source.id,
    slug: source.slug,
    title: source.title,
    image: source.image,
    price: source.price,
    compareAtPrice: source.compareAtPrice,
    discountPercent: source.discountPercent,
    inStock: source.inStock,
    defaultVariantId: source.defaultVariantId,
    stock: source.stock,
    category: source.category,
  };

  const brandName = source.brand?.name?.trim();
  if (brandName) {
    card.brandName = brandName;
  }

  const description = source.description?.trim();
  if (description) {
    card.description = description;
  }

  return card;
}

export function sortCatalogCardProducts(
  items: CatalogCardProduct[],
  sortBy: string
): CatalogCardProduct[] {
  const sorted = [...items];
  switch (sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    default:
      break;
  }
  return sorted;
}

export function apiListingToCatalogCardProduct(product: ApiListingProduct): CatalogCardProduct {
  return toCatalogCardProduct({
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description ?? null,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    originalPrice: product.originalPrice ?? null,
    discountPercent: product.discountPercent ?? null,
    image: product.image ?? null,
    inStock: product.inStock ?? true,
    defaultVariantId: product.defaultVariantId ?? null,
    stock: typeof product.stock === 'number' ? product.stock : undefined,
    brand: product.brand ?? null,
    category: product.categories?.[0]?.title ?? '',
  });
}
