import { MenuClient } from './MenuClient';
import type { HomeSectionProduct } from '@/lib/home/home-menu-favorites';

interface MenuSectionProps {
  products: HomeSectionProduct[];
  totalPages: number;
}

/**
 * Menu section — data is loaded once in `HomePage` via `getHomeMenuAndFavoritesData`.
 */
export function MenuSection({ products, totalPages }: MenuSectionProps) {
  return (
    <section
      className="relative bg-[#2f3f3d] overflow-hidden min-h-[1000px] py-16 md:py-24 rounded-t-[37px] -mt-[26px] z-10"
      data-home-header-surface="dark"
    >
      <MenuClient initialItems={products} totalPages={totalPages} />
    </section>
  );
}
