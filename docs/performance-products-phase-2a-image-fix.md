# /products Phase 2A Image Fix Report

**Date:** 2026-07-03  
**Scope:** Phase 2A only — image URL wiring for `/products` (no query/cache/ISR changes)

---

## Summary

Phase 2A wires existing Phase 1 R2 WebP helpers into the `/products` render path so decorative backgrounds, product card thumbnails, and category sidebar preview images use pre-generated optimized URLs instead of multi‑MB PNG/JPG sources.

**Results (local production build `localhost:3001/products`):**

| Metric | Before (production audit) | After (Phase 2A local) |
|--------|---------------------------|-------------------------|
| `union-decorative.png` in HTML/network | **Yes** (2.31 MB) | **No** |
| Optimized WebP in HTML | **0** | **625+ `400w.webp` refs**, **6× `900w.webp`** |
| JPG in serialized HTML | **31+ R2 JPG URLs** | **0** |
| Image encoded (warm browser) | **~2.26 MB** | **~75 KB** (+ Next Image proxy overhead) |
| Largest product image | **9.35 MB JPG** | **~23 KB** (Next-optimized 400w WebP) |
| `/api/products` browser calls | None | None (unchanged) |

Lint and build pass. Page renders correctly on desktop with sidebar, carousels, and pagination.

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/app/(main)/products/page.tsx` | `toOptimizedDecorativeUrl` for 3 decorative `<img>`; `loading="lazy"` + `decoding="async"` |
| `apps/web/lib/services/products-find-transform.service.ts` | Map listing `image` through `toOptimizedProductCardUrl` at transform time |
| `apps/web/lib/services/products-nav-preview.service.ts` | Map preview images through `toOptimizedProductCardUrl` in `extractPreviewImage` |
| `apps/web/components/CategoryNavigation/ProductsCategorySidebar.tsx` | Reduce `imagePriority` from first 8 → first 2 sidebar rows |
| `apps/web/components/CategoryNavigation/CategoryIcon.tsx` | Remove `unoptimized`; add `sizes`; lazy-load when not priority |

**Not changed:** Prisma queries, pagination, grouping, cache/ISR, carousel layout, DB schema.

---

## Image URL Mapping

| Source | Original pattern | Optimized pattern | Helper |
|--------|------------------|-------------------|--------|
| Decorative background | `/assets/hero/union-decorative.png` | `assets/optimized/assets/hero/union-decorative-900w.webp` | `toOptimizedDecorativeUrl` |
| Product card (listing) | `menu/import/.../*.jpg` or `*.webp` | `assets/optimized/menu/import/.../*-400w.webp` | `toOptimizedProductCardUrl` |
| Sidebar nav preview | Same as product media | Same `-400w.webp` | `toOptimizedProductCardUrl` in `extractPreviewImage` |

Helpers resolve via `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` → full R2 HTTPS URL (`staticAssetHref(toR2Url(...))`).  
If env is missing, helpers fall back to local `/assets/optimized/...` paths (Vercel production has R2 env set).

**R2 verification (200 OK):**

- `assets/optimized/assets/hero/union-decorative-900w.webp` — **179 KB**
- `assets/optimized/menu/import/deserty/deserty-krasnyi-barhat-a1ca297a9e-400w.webp` — **63 KB**

No optimized WebP binaries were added to git; assets remain R2-only.

---

## Decorative Image Fix

**Before:** Three `<img src={toR2Url('/assets/hero/union-decorative.png')}>` — 2.31 MB PNG each (browser dedupes to one download, still 2.31 MB).

**After:** Three `<img src={toOptimizedDecorativeUrl(...)} loading="lazy">` — ~179 KB WebP each (same URL deduped).

HTML check: `union-decorative.png` count **0**, `union-decorative-900w.webp` count **6** (3 DOM + RSC payload).

---

## Product Card Image Fix

**Before:** `transformProducts` returned raw `processImageUrl(media[0])` — JPG URLs serialized into RSC; client `ProductCardGrid` could optimize but HTML still contained originals on production.

**After:** Server-side in `transformProducts`:

```typescript
return toOptimizedProductCardUrl(firstImage) ?? firstImage;
```

- Applies to all `findAll` listing responses (shop page, API, home loaders — idempotent via `isAlreadyOptimized`).
- **PDP unchanged** — uses `findBySlug` / `getProductForPage`, not `transformProducts`.
- Fallback to original URL when optimized key missing.

---

## Sidebar Preview Image Fix

**Before:** `extractPreviewImage` returned raw R2 JPG URLs (up to 13 MB) serialized into sidebar RSC props.

**After:** Same helper applied at end of `extractPreviewImage`:

```typescript
return toOptimizedProductCardUrl(raw) ?? raw;
```

Also benefits `/api/v1/products/category-nav-previews` (mobile drawer client fetch path).

**Lazy/priority:** Sidebar `imagePriority` reduced from 8 → 2 rows; `CategoryIcon` uses `loading="lazy"` when not priority and removes `unoptimized` so Next Image serves WebP efficiently.

---

## Before/After Metrics

### Production audit baseline (pre–Phase 2A, warm browser)

| Metric | Value |
|--------|-------|
| TTFB | ~69 ms warm / ~510 ms cold |
| Load event | ~711 ms |
| Image encoded | ~2.26 MB |
| Top image | `union-decorative.png` 2,310,581 B |
| Optimized WebP in HTML | 0 |
| Old JPG product refs | Yes (deserty 9 MB+) |

### Local Phase 2A build (`npm run build` + `next start -p 3001`)

| Metric | Value |
|--------|-------|
| TTFB | ~34 ms (warm local) |
| Load event | ~172 ms |
| HTML size | 337 KB (larger due to longer optimized URLs in RSC) |
| Image encoded (browser) | **~75 KB** |
| Image transfer | **~1.7 KB** (mostly 304s) |
| `union-decorative.png` requests | **0** |
| Product JPG/PNG requests | **0** |
| Optimized WebP requests | **8+** (via `/_next/image` proxy) |
| Top image (encoded) | dessert `-400w.webp` ~23 KB (Next resized to w=256) |
| `/api/*` calls | 0 |

**Note:** Production metrics will match after deploy + cache bust. HTML URL length increases slightly; image bytes drop dramatically.

---

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (exit 0) |
| `npm run build` | Pass (exit 0) |
| `/products` desktop | Renders 6 category rows, sidebar, pagination |
| `/products` mobile | Category filter drawer, carousels visible |
| Broken images | None observed |
| Console errors | None observed |
| Layout shifts | None observed (same card/sidebar layout) |
| Git binaries | No `public/assets/**/optimized/*.webp` added |

---

## Remaining Issues For Phase 2B/2C/2D

| Phase | Issue |
|-------|-------|
| **2B** | Product query still fetches deep Prisma includes (`take=1200` cap); 120-product transform cost unchanged |
| **2C** | Category nav previews still ~35 DB round-trips on cold SSR; all 18 previews still serialized |
| **2D** | ISR/CDN still disabled (`searchParams` → `no-store`); TTFB ~510 ms cold on production |
| **2E** | 35 products still hydrated client-side; carousel/client bundle unchanged |
| **Images** | Products without pre-generated `-400w.webp` on R2 fall back to original (safe but may be large) — run `optimize:home-images --upload` for new catalog imports |
| **HTML size** | Longer optimized URLs increase RSC payload slightly (~337 KB vs ~225 KB) — acceptable tradeoff for image bytes |

---

## Environment Notes

- **`NEXT_PUBLIC_R2_PUBLIC_BASE_URL`:** Required in production for R2 URLs. Verified on Vercel production CDN (`pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev`).
- **Local dev without env:** Helpers emit `/assets/optimized/...` paths; images 404 unless env set or local public copies exist — do not commit public optimized binaries.
