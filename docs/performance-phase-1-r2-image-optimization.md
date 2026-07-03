# Phase 1 R2 Image Optimization Report

**Date:** 2026-07-03  
**Scope:** Homepage image transfer reduction (Phase 1 only — no ISR/DB/admin changes)

---

## Summary

Homepage first-load image transfer was dominated by **unoptimized multi‑MB R2 JPG/PNG files** (hero background, favorites decorative pattern, and dessert product photos from `product.media` in Postgres). Phase 1 adds:

1. A **Sharp-based optimization script** that generates WebP variants and uploads them to R2.
2. **`lib/image-optimization.ts`** URL helpers used by homepage data loaders and UI components.
3. **Removed global `images.unoptimized = true`** so Next.js Image can optimize remote assets where applicable.
4. **Duplicate-load mitigation** via `x-home-variant` single-tree render in production and lazy-loading below-fold images.

**Result:** Input assets ~**31 MB** compressed to ~**2.7 MB** of WebP outputs. Expected homepage image transfer drops from ~**9 MB** to roughly **1.5–2.5 MB** per variant (desktop or mobile only in production).

---

## Biggest Images Before

| Asset | URL / key | Size | Section | Above fold? | Duplicated? |
|-------|-----------|------|---------|-------------|-------------|
| Krasnyy barhat dessert | `menu/import/deserty/deserty-krasnyi-barhat-a1ca297a9e.jpg` | **9.35 MB** JPEG | Menu + Favorites (desktop); mobile sections when both trees rendered | No | Yes (menu + favorites + mobile/desktop) |
| Medovik dessert | `deserty-medovik-s-sole-noi-karamelyu-dffbb5d49b.jpg` | **7.58 MB** JPEG | Same | No | Yes |
| Muraveynik dessert | `deserty-muravei-nik-a8a1189c69.jpg` | **8.07 MB** JPEG | Same | No | Yes |
| Hero background | `/assets/hero/hero.png` | **2.52 MB** PNG | Hero (LCP) | **Yes** | Once per variant |
| Union decorative | `/assets/hero/union-decorative.png` | **2.31 MB** PNG | Favorites / Mobile menu / Mobile favorites | No | **Yes** (3 components + dual tree) |
| Hero pattern | `/assets/hero/hero-pattern-figma.png` | **405 KB** PNG | Hero overlay | Yes | Once |
| Sauce products (webp) | `menu/import/sousy/*.webp` | ~200 KB each | Menu / mobile | No | Overlap between sections |

**Sources:** Product images from **`products.media`** via `products-find-transform.service.ts` → home loaders. Static hero/decorative from **`public/assets/hero/`** (also on R2). Dessert JPGs imported under **`menu/import/deserty/`** on R2 (not in repo).

---

## Biggest Images After

| Asset | Optimized key | Size (typical) | Reduction |
|-------|---------------|----------------|-----------|
| Hero background | `assets/hero/optimized/hero-{768,1200,1600}w.webp` | **109–244 KB** | ~**90%** |
| Union decorative | `assets/optimized/assets/hero/union-decorative-900w.webp` | **179 KB** | ~**92%** |
| Hero pattern | `assets/hero/optimized/hero-pattern-figma-1200w.webp` | **69 KB** | ~**83%** |
| Krasnyy barhat (card) | `assets/optimized/menu/import/deserty/...-400w.webp` | **63 KB** | ~**99%** |
| Medovik (card) | `...-400w.webp` | **57 KB** | ~**99%** |
| Muraveynik (card) | `...-400w.webp` | **47 KB** | ~**99%** |
| Gallery / about | `assets/optimized/assets/New folder/*-800w.webp` | **67–223 KB** | ~**15–65%** (already WebP sources) |

Manifest: `apps/web/lib/image-optimization-manifest.json` (generated 2026-07-03).

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/lib/image-optimization.ts` | **New** — URL helpers for hero, decorative, card, carousel |
| `apps/web/scripts/optimize-homepage-images.ts` | **New** — Sharp WebP generation + optional R2 upload |
| `apps/web/lib/image-optimization-manifest.json` | **New** — generated size audit |
| `apps/web/lib/home/home-menu-favorites.ts` | Card image URLs optimized at map time |
| `apps/web/lib/home/mobile-new-arrivals.ts` | Same |
| `apps/web/lib/home/mobile-home-sections.ts` | Same |
| `apps/web/lib/home/home-carousel-images.ts` | Carousel hrefs → optimized 800w WebP |
| `apps/web/app/(main)/page.tsx` | Single-tree render when `x-home-variant` set |
| `apps/web/next.config.js` | Removed `images.unoptimized = true` |
| `apps/web/components/homePage/Hero.tsx` | Hero srcset + fetchPriority on LCP only |
| `apps/web/components/homePage/Favorites.tsx` | Optimized decorative + lazy |
| `apps/web/components/homePage/About.tsx` | Optimized gallery images + lazy |
| `apps/web/components/homePage/HomePageImageCarousel.tsx` | Removed priority/high; lazy load |
| `apps/web/components/ProductCard/ProductCardGrid.tsx` | Card URL helper + lazy |
| `apps/web/components/mobileHomePage/MobileRecipeProductCard.tsx` | Card URL helper + lazy |
| `apps/web/components/mobileHomePage/MobileFavorites.tsx` | Optimized decorative |
| `apps/web/components/mobileHomePage/MobileMenuClient.tsx` | Optimized decorative |
| `apps/web/package.json` | `optimize:home-images` script |
| `apps/web/public/assets/**/optimized/**` | Generated WebP binaries (committed) |

---

## Scripts Added

```bash
# Generate WebP from public hero assets + fetch product JPGs from production API
npm run optimize:home-images --workspace=@shop/web

# Dry run
npx tsx apps/web/scripts/optimize-homepage-images.ts --dry-run

# Upload optimized files to R2 (requires R2_* env)
npx tsx apps/web/scripts/optimize-homepage-images.ts --upload
```

**Verified:** `--upload` pushed optimized keys to R2 (`Content-Length` confirmed for hero and dessert WebP on CDN).

---

## Image Source Mapping

| Production URL pattern | DB / code source | Homepage section |
|------------------------|------------------|------------------|
| `menu/import/deserty/*.jpg` | `Product.media[0]` via `products-find-transform.service.ts` | Menu, Favorites, Mobile Top, New arrivals |
| `menu/import/sousy/*.webp` | Same | Menu (first page products), mobile carousels |
| `/assets/hero/hero.png` | Static / R2 (`Hero.tsx`) | Hero LCP |
| `/assets/hero/union-decorative.png` | Static / R2 (`Favorites`, mobile sections) | Favorites background |
| `/assets/New folder/*.webp` | Static (`About`, carousel) | About, gallery carousel |

**DB records were not modified.** Thumbnails are resolved at runtime via `toOptimizedProductCardUrl()`.

---

## Duplicate Loading Fixes

| Issue | Fix |
|-------|-----|
| Mobile + desktop both in HTML on production | `page.tsx` renders **one tree** when `x-home-variant` is `mobile` or `desktop` (from `proxy.ts`) |
| `union-decorative.png` in 3 components | All use **same optimized URL** + `loading="lazy"` |
| Carousel `priority` / `fetchPriority="high"` below fold | Removed; **lazy** loading |
| Product cards eager-loading full JPGs | **400w WebP** + `loading="lazy"` |
| Hero LCP | Only hero background uses **`fetchPriority="high"`** with responsive WebP srcset |

**Dev fallback:** When `x-home-variant` is absent, both trees still render (CSS hide) for local testing.

---

## Validation

| Check | Result |
|-------|--------|
| `npm run lint --workspace=@shop/web` | **Pass** (0 errors) |
| `npm run build --workspace=@shop/web` | **Pass** |
| R2 CDN HEAD on optimized hero + dessert | **200**, correct `Content-Type: image/webp` |
| Local prod server | Port 3000 already in use (existing process); build artifact OK |

**Manual QA recommended after deploy:** homepage desktop/mobile, hero, menu/favorites/new products, no broken images, no layout shift.

---

## Performance Verification

### Before (audit baseline, production)

| Metric | Value |
|--------|-------|
| Total image transfer (browser) | **~9.1 MB** |
| Hero PNG | **2.52 MB** |
| Largest dessert JPG | **~9.3 MB** (loaded multiple times) |
| union-decorative | **2.31 MB × 2 requests** |
| TTFB | ~400–800 ms |
| Load event | ~2.2 s (warm) |

### After (estimated from manifest + single-tree + lazy)

| Metric | Expected |
|--------|----------|
| Total image transfer (desktop variant) | **~1.5–2.5 MB** |
| Hero (1600w WebP) | **~244 KB** |
| Largest dessert on homepage | **~63 KB** (400w WebP) |
| union-decorative | **~179 KB** once |
| Duplicate dessert JPG requests | **0** (WebP card URLs) |
| TTFB | Unchanged (Phase 2 scope) |

*Post-deploy: re-run Chrome Network or Lighthouse on production to confirm.*

---

## Remaining Issues For Phase 2

1. **ISR / CDN cache** — homepage still dynamic SSR (`Cache-Control: no-store`); not addressed in Phase 1.
2. **Sauce product images** — already WebP (~200 KB); could add 400w variants if needed.
3. **More dessert SKUs** — script only optimized JPGs returned by API page 1 + 3 known giants; re-run `optimize:home-images` after menu changes.
4. **Next.js Image remote optimizer** — re-enabled globally; monitor Vercel image optimization quota/latency on first request.
5. **Dual-tree dev fallback** — still loads both variants without `x-home-variant`.
6. **Carousel** — only first 3 gallery slides pre-optimized in initial script run; all `New folder` WebPs now included.

---

## Next Image Config

Removed `images.unoptimized: true`. Kept R2 / CDN `remotePatterns`. SVG vase/wordmark still use `unoptimized` where required. Homepage product/card images use pre-generated WebP on R2 to avoid relying on optimizer for 9 MB sources.
