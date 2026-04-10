import { HOME_CAROUSEL_PRELOAD_HREF_ORDER } from '@/lib/home/home-carousel-images';

/**
 * Route-level preload for desktop gallery WebPs. `media` avoids fetching on narrow viewports even though
 * the desktop React tree is still mounted (CSS-hidden on mobile).
 */
export function HomeCarouselPreloadLinks() {
  return (
    <>
      {HOME_CAROUSEL_PRELOAD_HREF_ORDER.map((href) => (
        <link
          key={href}
          rel="preload"
          href={href}
          as="image"
          media="(min-width: 768px)"
        />
      ))}
    </>
  );
}
