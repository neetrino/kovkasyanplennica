type SearchParamsLike =
  | URLSearchParams
  | { toString(): string }
  | null
  | undefined;

/**
 * Builds `/products` URL for category navigation while preserving active filters.
 */
export function buildProductsCategoryHref(
  categorySlug: string | null,
  searchParams: SearchParamsLike,
): string {
  const params = new URLSearchParams(searchParams?.toString() ?? '');

  if (categorySlug && categorySlug !== 'all') {
    params.set('category', categorySlug);
  } else {
    params.delete('category');
  }

  params.delete('page');

  const qs = params.toString();
  return qs ? `/products?${qs}` : '/products';
}
