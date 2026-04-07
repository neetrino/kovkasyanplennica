import { getCachedNewArrivalsProducts } from '@/lib/home/mobile-new-arrivals';
import type { MobileNewArrivalProduct } from '@/lib/home/mobile-new-arrivals';
import {
  getMobileFeaturedTopProducts,
  getMobileRootCategories,
} from '@/lib/home/mobile-home-sections';
import { MobileCategoriesSection } from './MobileCategoriesSection';
import { MobileHomeReservationBlock } from './MobileHomeReservationBlock';
import { MobileNewArrivalsSection } from './MobileNewArrivalsSection';
import { MobileTopSection } from './MobileTopSection';

const FEATURED_TOP_CAROUSEL_LIMIT = 12;

type MobileHomePageProps = {
  /** When omitted (e.g. `/mobile` preview), loads cached new-arrivals server-side. */
  newArrivalsProducts?: MobileNewArrivalProduct[];
};

export async function MobileHomePage({ newArrivalsProducts }: MobileHomePageProps = {}) {
  const arrivals =
    newArrivalsProducts ?? (await getCachedNewArrivalsProducts('ru'));

  const [topProducts, rootCategories] = await Promise.all([
    getMobileFeaturedTopProducts(FEATURED_TOP_CAROUSEL_LIMIT),
    getMobileRootCategories(),
  ]);

  return (
    <div className="overflow-x-clip overflow-y-visible bg-[#2f3f3d] text-white">
      <div className="mx-auto flex w-full max-w-[375px] flex-col px-4 pt-6">
        <MobileTopSection products={topProducts} />

        <MobileCategoriesSection categories={rootCategories} />

        <MobileNewArrivalsSection products={arrivals} />

        <MobileHomeReservationBlock />
      </div>
    </div>
  );
}
