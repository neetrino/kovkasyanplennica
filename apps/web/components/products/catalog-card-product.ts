/** Minimal product shape serialized from /products server page to client carousel/cards. */
export type CatalogCardProduct = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  inStock: boolean;
  defaultVariantId?: string | null;
  stock?: number;
  brand: { id: string; name: string } | null;
  category: string;
  description?: string | null;
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

export function toCatalogCardProduct(source: CatalogCardSource): CatalogCardProduct {
  return {
    id: source.id,
    slug: source.slug,
    title: source.title,
    image: source.image,
    price: source.price,
    compareAtPrice: source.compareAtPrice,
    originalPrice: source.originalPrice,
    discountPercent: source.discountPercent,
    inStock: source.inStock,
    defaultVariantId: source.defaultVariantId,
    stock: source.stock,
    brand: source.brand,
    category: source.category,
    description: source.description ?? null,
  };
}
