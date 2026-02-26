import { MenuClient } from './MenuClient';

interface MenuItem {
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
}

interface MenuProps {
  items?: MenuItem[];
}

/**
 * Menu Section Component (Server Component)
 * 
 * Секция меню на главной странице с карточками продуктов
 * в стиле Figma дизайна
 */
export function Menu({ items }: MenuProps) {
  return (
    <section className="relative bg-[#2f3f3d] overflow-hidden min-h-[893px] py-16 md:py-24 rounded-[37px] -mt-[26px] z-10">
      <MenuClient initialItems={items} />
    </section>
  );
}

