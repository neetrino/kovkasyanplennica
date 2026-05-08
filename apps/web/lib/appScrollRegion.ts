/**
 * App scroll root: outer column in `(main)/layout` (`data-app-scroll-region`) — full-viewport scrollbar.
 */
export const APP_SCROLL_REGION_DOM_ID = 'app-scroll-region' as const;

export const APP_SCROLL_REGION_SELECTOR = '[data-app-scroll-region]' as const;

/**
 * Returns the scrollable element for main content (not `window`), or
 * `document.documentElement` if the region node is missing.
 * Returns `null` during SSR — call from `useEffect` or event handlers.
 */
export function getAppScrollRegion(): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  return (
    document.getElementById(APP_SCROLL_REGION_DOM_ID) ??
    document.querySelector<HTMLElement>(APP_SCROLL_REGION_SELECTOR) ??
    document.documentElement
  );
}

/** Scroll the main app column to top (not `window` — matches layout scroll root). */
export function scrollAppScrollRegionToTop(behavior: ScrollBehavior = 'smooth'): void {
  const el = getAppScrollRegion();
  if (!el) return;
  el.scrollTo({ top: 0, behavior });
}
