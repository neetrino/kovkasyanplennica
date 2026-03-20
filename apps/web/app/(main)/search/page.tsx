import { redirect } from 'next/navigation';

/**
 * Search page — redirects to products with optional search query.
 * Fixes 404 when mobile nav links to /search.
 */
export default function SearchPage() {
  redirect('/products');
}
