import { Hero } from './Hero';
import { MenuSection } from './MenuSection';
import { FavoritesSection } from './FavoritesSection';
import { About } from './About';
import { HomePageImageCarousel } from './HomePageImageCarousel';

export function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <MenuSection />
      <About />
      <FavoritesSection />
      <HomePageImageCarousel />
    </div>
  );
}

