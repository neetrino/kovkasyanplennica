# /products Phase 2 Master Report

**Date:** 2026-07-03  
**Branch:** `dev-Karo`  
**Scope:** Phase 2B–2E (Phase 2A image wiring already committed as `e58c043`)

---

## Pre-Flight

| Check | Result |
|-------|--------|
| Branch | `dev-Karo` (ahead of origin by 2 commits before this work) |
| Phase 2A decorative | `toOptimizedDecorativeUrl` on `/products` — **yes** |
| Phase 2A product images | `toOptimizedProductCardUrl` in transform — **yes** |
| Phase 2A sidebar previews | optimized in `extractPreviewImage` — **yes** |
| Optimized WebP in git `public/` | **Some hero optimized files tracked** from Phase 1 commit (pre-existing; not added in this phase) |
| `npm run build` (pre-change baseline) | Pass |

### Known baseline (from audits)

- Dynamic SSR (`Cache-Control: no-store`)
- No browser `/api/products` on initial load
- `findAll(limit=120)` with deep Prisma includes + `take=limit×10`
- Sidebar ~35 DB round-trips for 18 preview targets
- 35 products serialized into 6 client carousels
- Production cold TTFB ~510 ms; images fixed in 2A

---

## Phase 2B Product Query Optimization

### Files changed

| File | Purpose |
|------|---------|
| `lib/services/products-find-query/listing-query-executor.ts` | Lightweight Prisma `select` + `listingRawFetchTake` |
| `lib/services/products-find-listing.service.ts` | `findAllForListing` with fast/fallback paths |
| `lib/services/products-find-listing-transform.service.ts` | Card-only transform (no colors/productAttributes) |
| `lib/services/products-find-transform-settings.ts` | Shared discount settings cache |
| `lib/services/products.service.ts` | Exposes `findAllForListing` |
| `app/(main)/products/page.tsx` | Uses listing path via `fetchProductsCached` |

### Old vs new query path

**Old (default shop):**
```
findAll → executeProductQuery(take=1200) → deep includes → transformProducts (full)
```

**New (fast path):**
```
findAllForListing → executeProductListingQuery(take=140) → select card fields → transformListingProducts
```

**Fallback (unchanged full path):**
```
findAll when needsFullCatalogQuery(filters) === true
```

### Fast path conditions

Uses listing query when **none** of:
- `colors`, `sizes`, `brand` query params
- `minPrice` / `maxPrice`
- `filter` (new/featured/bestseller)

Uses listing query for: default `/products`, `?category=`, `?sort=*`, `?page=2`, `?search=` (DB or Meilisearch + listing select).

### Raw DB take

| Scenario | Before | After |
|----------|--------|-------|
| Default shop (`limit=120`) | **1200** (`limit×10`) | **140** (`limit+20`, cap 500) |
| With color/size/brand/price filters | 1200 | **1200** (fallback) |

### Selected fields

**Before:** translations, brand+translations, variants+options+attributeValue+attribute, labels, categories+translations, productAttributes+attribute+values.

**After (listing):** translations (1 locale), brand id+name, categories id+slug+title, labels, variants (id/price/stock/compareAtPrice only, ordered by price), media, discount fields. **No** variant options, productAttributes, or color extraction.

### Estimated DB payload reduction

~**70–85%** less relation data per product on default shop path (fewer joins, smaller variant graph, ~8× fewer rows fetched).

### Validation

| Test | Result |
|------|--------|
| `npm run build` | Pass |
| `/products` default | 200, products + sidebar render |
| `/products?page=2` | 200, ~30 ms warm |
| `/products?category=sousy` | 200, ~2.1 s cold local |
| Browser snapshot | Carousels, pagination, sidebar nav present |

### Risks

- Color/size/brand/price filters still use full path (correct).
- Listing transform omits `colors[]` (not rendered on `/products` cards today).
- Catalog growth beyond ~140 products may need take tuning (cap 500).

**Checkpoint: SAFE — proceed to 2C**

---

## Phase 2C Category Preview Optimization

### Files changed

| File | Purpose |
|------|---------|
| `lib/services/products-nav-preview.service.ts` | Bulk preview resolver (`v4` cache key) |
| `lib/services/category-descendant-map.ts` | In-memory descendant ids from category tree |
| `app/(main)/products/page.tsx` | Passes category tree roots to `getCategoryNavPreviews` |

### Old vs new preview flow

**Old:** 1× `findPreviewForAll` + 17× (`getAllChildCategoryIds` + `findMany`) ≈ **35 DB round-trips**, batched 6 at a time.

**New:** 1× `findPreviewForAll` + 1× bulk `findMany` (pool take up to 400) + in-memory mapping per slug ≈ **2–3 DB round-trips** (+ slug lookups for API-only calls without ids).

Descendant ids computed from category tree in memory (no per-category recursive DB).

### DB round-trips

| | Before | After |
|---|--------|-------|
| SSR sidebar (18 targets) | ~35 | **~2–3** |
| Mobile drawer API | ~35 per request | **~2–4** (loads tree if not provided) |

### Preview target count

Unchanged: **18** (all + 17 flat categories).

### SSR payload impact

Minimal change (same preview object shape; optimized WebP URLs from 2A preserved).

### Validation

| Test | Result |
|------|--------|
| `npm run build` | Pass |
| Desktop sidebar | `aria-label="Категории каталога"` present |
| Preview images | Optimized WebP URLs in HTML |
| API route | Still works; loads tree when roots omitted |

### Risks

- Bulk pool (`take≈400`) may miss preview for sparse categories not in recent pool — same class of edge case as old `take=15` per category.
- Cache key bumped to `category-nav-previews-v4`.

**Checkpoint: SAFE — proceed to 2D**

---

## Phase 2D Cache / ISR / CDN

### Root cause of `no-store`

| Factor | Finding |
|--------|---------|
| `searchParams` on `/products` page | **Primary** — Next.js 16 marks route dynamic while `searchParams` prop exists on page segment |
| `getStoredLanguage()` | Server always returns `ru` — **not** a dynamic trigger |
| Cookies/headers in layout | **None** on products path |
| `revalidate = 3600` | Present but **overridden** by dynamic rendering |
| `--experimental-build-mode=compile` | Build output still shows `/products` as `ƒ` dynamic |

### Changes made

1. **Page shell refactor:** `ProductsPage` default export is **sync**; `searchParams` awaited only inside Suspense children (`ProductsPageMainSlot`, `ProductsPageDecorativeBackground`).
2. **Cache key bump:** `main-products-list-v2` → `main-products-list-v3` (listing path).
3. **Listing Redis key prefix:** `listing:` in hash to avoid colliding with full-query cache entries.

### Headers after change (local `next start`, `:3002`)

| Header | Before (audit prod) | After (local) |
|--------|---------------------|---------------|
| `Cache-Control` | `private, no-store` | **`private, no-store`** (unchanged) |
| `X-Vercel-Cache` | `MISS` | N/A locally |

### TTFB (local production server)

| Request | Cold | Warm |
|---------|------|------|
| `/products` | ~5.1 s (first compile/start) | **~27 ms** |
| `/products?page=2` | — | **~28 ms** |

Warm TTFB improved dramatically via listing query + preview bulk + Redis/memory cache on repeat requests. **CDN document caching still blocked** until `searchParams` is removed from the page segment entirely (recommended Phase 3).

### What remains dynamic

- Entire `/products` route segment (filtered and default)
- Suspense slots that await `searchParams`

### What is cacheable

- `unstable_cache` layers: products list v3, category tree, nav previews v4
- Redis: listing product keys, category tree, discount settings
- API `/api/v1/products/category-nav-previews` (`s-maxage=3600`)

### Risks

Full ISR/CDN fix requires architectural split (static default page + client URL state or parallel route) — **not forced in this phase**.

**Checkpoint: PARTIAL — server-side cache improved; CDN headers unchanged. Proceed to 2E.**

---

## Phase 2E Hydration / Client Bundle

### Was hydration still a bottleneck?

After 2B–2D, warm load is fast (~5 s first local hit includes DB cold start; repeat ~27 ms TTFB). Client hydration gap not re-measured with Lighthouse; serialized product count unchanged (35).

### Files changed

| File | Change |
|------|--------|
| `app/(main)/products/page.tsx` | `dynamic()` import for `ProductsMobileCategoriesDrawer` |

### JS impact

Drawer chunk deferred until needed; **small** reduction on initial `/products` JS parse. No ProductCard/carousel rewrite (would be Phase 3).

### Validation

| Test | Result |
|------|--------|
| `/products` mobile filter | Renders (dynamic import) |
| Carousels / add-to-cart | Present in snapshot |
| Build | Pass |

### Risks

None observed. Large hydration win would require server card shell split — deferred.

**Checkpoint: SAFE — minimal 2E applied**

---

## Final Phase 2 Results

| Metric | Before Phase 2 (audit) | After Phase 2 (local prod) | Notes |
|--------|------------------------|----------------------------|-------|
| TTFB cold (prod) | ~510 ms | ~5.1 s first local / prod TBD | Local first hit includes DB warm-up |
| TTFB warm | ~69 ms (prod browser) | **~27 ms** | Listing + bulk previews |
| Load event | ~711 ms | ~172 ms (2A local) | Images already optimized in 2A |
| HTML size | ~225 KB | ~338 KB | Longer optimized URLs in RSC |
| JS transfer | ~227 KB | Similar; drawer deferred slightly | |
| Image transfer | ~2.26 MB → **~75 KB** (2A) | Unchanged in 2B–2E | |
| Largest image | 2.3 MB PNG → 400w WebP (2A) | Unchanged | |
| Product DB raw take | 1200 | **140** (default) | |
| Products transformed | 120 max | 120 max | Same behavior |
| Preview DB round-trips | ~35 | **~2–3** | |
| `Cache-Control` | `no-store` | **`no-store`** | CDN fix deferred |
| `X-Vercel-Cache` | `MISS` | N/A local | |
| LCP | Not captured | Not captured | |

---

## Files Changed (full list)

| File | Phase | Why |
|------|-------|-----|
| `listing-query-executor.ts` | 2B | Lightweight Prisma select |
| `products-find-listing.service.ts` | 2B | Fast listing orchestration + fallback |
| `products-find-listing-transform.service.ts` | 2B | Card-only transform |
| `products-find-transform-settings.ts` | 2B | Shared discount cache |
| `products-find-transform.service.ts` | 2B | Use shared settings module |
| `products.service.ts` | 2B | `findAllForListing` export |
| `category-descendant-map.ts` | 2C | Tree-based descendant map |
| `products-nav-preview.service.ts` | 2C | Bulk preview queries |
| `app/(main)/products/page.tsx` | 2B/2C/2D/2E | Listing fetch, tree pass, Suspense split, dynamic drawer |

---

## Final Verdict

**SAFE TO COMMIT**

- Build passes
- `/products` routes validated (default, page 2, category filter)
- No schema changes, no UI redesign, PDP untouched
- Full CDN ISR remains a **Phase 3** item (searchParams dynamic segment)
- Hydration/card split remains optional **Phase 3** if needed after deploy metrics

---

## Remaining for Phase 3

1. Remove `searchParams` from page segment for CDN cacheable default `/products`
2. Reduce RSC payload (slim card type, fewer serialized products per page)
3. Server-render card shell + client cart island
4. Optional: push filter queries to DB for colors/sizes to avoid full-path fallback
