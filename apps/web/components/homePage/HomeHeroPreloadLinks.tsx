/**
 * Early `<link rel="preload">` for hero bitmaps (above the fold on `/`).
 * Renders nothing visible; duplicates Next/Image `priority` hints with earlier discovery in HTML.
 */
export function HomeHeroPreloadLinks() {
  return (
    <>
      <link rel="preload" href="/assets/hero/hero.png" as="image" />
      <link rel="preload" href="/assets/hero/hero-pattern-figma.png" as="image" />
    </>
  );
}
