import { MobileHero } from './MobileHero';
import { MobileMenuSection } from './MobileMenuSection';
import { MobileAbout } from './MobileAbout';
import { MobileImageCarousel } from './MobileImageCarousel';
import { MobileFavoritesSection } from './MobileFavoritesSection';

/**
 * Mobile Home Page
 * Figma-based layout, split into sections like desktop HomePage.
 * Uses ProductCard for Menu and Favorites (same as homePage).
 * Bottom nav is rendered by layout (MobileBottomNav from this folder).
 */
export function MobileHomePage() {
  return (
    <div className="min-h-screen bg-[#2f3f3d] overflow-x-hidden">
      <MobileHero />
      <MobileMenuSection />
      <MobileAbout />
      <MobileFavoritesSection />
      <MobileImageCarousel />
    </div>
  );
}
