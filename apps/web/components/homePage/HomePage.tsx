import { Hero } from './Hero';
import { MenuSection } from './MenuSection';
import { FavoritesSection } from './FavoritesSection';
import { About } from './About';
import { HomePageImageCarousel } from './HomePageImageCarousel';
import {
  getHomeMenuAndFavoritesData,
  type HomeSectionProduct,
} from '@/lib/home/home-menu-favorites';

type HomePageProps = {
  menuProducts?: HomeSectionProduct[];
  favoritesProducts?: HomeSectionProduct[];
  menuTotalPages?: number;
};

export async function HomePage({
  menuProducts: menuProp,
  favoritesProducts: favProp,
  menuTotalPages: pagesProp,
}: HomePageProps = {}) {
  const { menuProducts, favoritesProducts, menuTotalPages } =
    menuProp !== undefined && favProp !== undefined && pagesProp !== undefined
      ? {
          menuProducts: menuProp,
          favoritesProducts: favProp,
          menuTotalPages: pagesProp,
        }
      : await getHomeMenuAndFavoritesData();

  return (
    <div className="min-h-screen">
      <Hero />
      <MenuSection products={menuProducts} totalPages={menuTotalPages} />
      <About />
      <div className="flex flex-col bg-[#2f3f3d]">
        <FavoritesSection products={favoritesProducts} />
        <HomePageImageCarousel />
      </div>
    </div>
  );
}
