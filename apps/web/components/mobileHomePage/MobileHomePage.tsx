import { MobileHero } from './MobileHero';
import { MobileMenuSection } from './MobileMenuSection';
import { MobileAbout } from './MobileAbout';
import { MobileFavoritesSection } from './MobileFavoritesSection';

/**
 * Mobile Home Page
 * Figma-based layout, split into sections like desktop HomePage.
 * Uses ProductCard for Menu and Favorites (same as homePage).
 * Bottom nav is rendered by layout (MobileBottomNav from this folder).
 */
export function MobileHomePage() {
  return (
    <div className="min-h-screen bg-[#ffe5c2] overflow-x-hidden">
      <MobileHero />
      <MobileMenuSection />
      <MobileAbout />
      <MobileFavoritesSection />
    </div>
  );
}
