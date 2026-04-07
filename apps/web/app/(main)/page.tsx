import { HomePage } from '@/components/homePage/HomePage';
import { MobileHomePage } from '@/components/mobileHomePage/MobileHomePage';
import { getHomeMenuAndFavoritesData } from '@/lib/home/home-menu-favorites';
import { getCachedNewArrivalsProducts } from '@/lib/home/mobile-new-arrivals';

/** ISR — home segment cache (aligned with products list freshness) */
export const revalidate = 120;

/**
 * Դեսկտոպ (md+)`HomePage`, մոբայլ՝ `MobileHomePage` — responsive բաժանում։
 * Տվյալները նախ բեռնվում են զուգահեռ (մեկ անգամ cached), հետո փոխանցվում են ծառերին։
 * Մոբայլ ծառի ներսում «Топ» + կատեգորիաները նույնպես մեկ `Promise.all`-ով են (տե՛ս `MobileHomePage`)։
 */
export default async function Page() {
  const lang = 'ru' as const;
  const [homeData, newArrivals] = await Promise.all([
    getHomeMenuAndFavoritesData(),
    getCachedNewArrivalsProducts(lang),
  ]);

  return (
    <>
      <div className="hidden md:block">
        <HomePage
          menuProducts={homeData.menuProducts}
          favoritesProducts={homeData.favoritesProducts}
          menuTotalPages={homeData.menuTotalPages}
        />
      </div>
      <div className="block md:hidden">
        <MobileHomePage newArrivalsProducts={newArrivals} />
      </div>
    </>
  );
}
