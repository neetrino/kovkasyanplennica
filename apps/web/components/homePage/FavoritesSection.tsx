import { Favorites } from './Favorites';
import type { HomeSectionProduct } from '@/lib/home/home-menu-favorites';

interface FavoritesSectionProps {
  products: HomeSectionProduct[];
}

/**
 * Favorites — data is loaded once in `HomePage` via `getHomeMenuAndFavoritesData`.
 */
export function FavoritesSection({ products }: FavoritesSectionProps) {
  return <Favorites items={products} />;
}
