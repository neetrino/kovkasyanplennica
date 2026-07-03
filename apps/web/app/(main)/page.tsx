import { HomePage } from '@/components/homePage/HomePage';
import { MobileHomePage } from '@/components/mobileHomePage/MobileHomePage';
import { getHomeMenuAndFavoritesData } from '@/lib/home/home-menu-favorites';
import { getCachedNewArrivalsProducts } from '@/lib/home/mobile-new-arrivals';
import { HOME_PAGE_METADATA } from '@/lib/site-metadata';
import { headers } from 'next/headers';

/** ISR — home segment cache (see public-cache-ttl.ts PUBLIC_PAGE_REVALIDATE_SECONDS) */
export const revalidate = 3600;

/** Explicit defaults so shared links use the same Russian blurb as the rest of the site (OG / Telegram / etc.). */
export const metadata = HOME_PAGE_METADATA;

/**
 * Դեսկտոպ (md+)`HomePage`, մոբайլ՝ `MobileHomePage`.
 * When `x-home-variant` is set (proxy.ts), only one tree is rendered to avoid duplicate image loads.
 * Without the header (local dev), both trees render with CSS visibility as before.
 */
export default async function Page() {
  const lang = 'ru' as const;
  const headerList = await headers();
  const homeVariant = headerList.get('x-home-variant');

  if (homeVariant === 'mobile') {
    const newArrivals = await getCachedNewArrivalsProducts(lang);
    return (
      <div className="block md:hidden">
        <MobileHomePage newArrivalsProducts={newArrivals} />
      </div>
    );
  }

  if (homeVariant === 'desktop') {
    const homeData = await getHomeMenuAndFavoritesData();
    return (
      <div className="hidden md:block">
        <HomePage
          menuProducts={homeData.menuProducts}
          favoritesProducts={homeData.favoritesProducts}
          menuTotalPages={homeData.menuTotalPages}
        />
      </div>
    );
  }

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
