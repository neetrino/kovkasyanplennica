# Phase 6 Products Performance / Cleanup Debug

**Date:** 2026-07-02  
**Branch:** `dev-Karo`  
**Phase type:** DEBUG / AUDIT ONLY — no production code changes  
**Scope:** `/products` SSR, client bundle, API calls, ProductCard contract, orphan filters, images, cache after Phase 5E2, Phase 5D test data, combined Phase 6 implementation plan

---

## Git state

| Item | Value |
|------|-------|
| **Branch** | `dev-Karo` |
| **Tracking** | Up to date with `origin/dev-Karo` |
| **Latest commits** | `68345bc` perf(products): replace filter scans with shared catalog queries · `7271f61` perf(products): cache filters and price range APIs · `a444410` perf(products): move color and size filters to database · `40d6df0` perf(products): use lightweight catalog listing query |
| **Local debug/test files** | Pre-existing untracked: `PHASE_1A_*`, `PHASE_4_*`, `PHASE_5D_*`, `PHASE_5E_*`, `scripts/phase5d-*`; modified: `PHASE_1_DEBUG_STATUS.md` |
| **Production code changed** | **no** |

---

## Prior reports confirmed

| Finding | Still true after Phase 5 |
|---------|--------------------------|
| Listing APIs optimized (5A–5D, 5C lightweight select) | **Yes** — DB pagination + listing transform for safe paths |
| Filters/price-range scans replaced (5E2) | **Yes** — warm ~22–26 ms locally |
| `/products` page itself not optimized in Phase 5 | **Yes** — still fetches `limit=120`, groups by category, category-row pagination |
| ProductCard: API has `categories[]`, page derives `category` string | **Yes** — no API `category` field |
| BrandFilter calls `limit=1000` | **Yes** — code unchanged |
| BrandFilter / ColorFilter / SizeFilter / PriceFilter not mounted | **Yes** — zero imports outside their own files |
| Phase 5D test data in dev DB | **No longer** — see test data section |

---

## Files inspected

| File | Purpose | Relevant findings |
|------|---------|-------------------|
| `apps/web/app/(main)/products/page.tsx` | SSR shop page | Server component; `unstable_cache` + `productsService.findAll`; always `getProducts(1, …, limit=120)`; category-row pagination (6 rows/page); decorative `<img>` backgrounds |
| `apps/web/components/ProductsCategoryCarousel.tsx` | Category product grid | **Client**; client-side sort (`price-asc`, etc.); strips `labels`; passes full product props to `ProductCard` |
| `apps/web/components/ProductsShopToolbar.tsx` | Sort/filter UI | **Client**; sort via URL; “Filter” dropdown is name sort only — no facet components |
| `apps/web/components/ProductCard.tsx` | Listing card | **Client**; `useAddToCart`, `useCurrency`; grid/list layouts |
| `apps/web/components/ProductCard/ProductCardGrid.tsx` | Grid layout | **Client**; `next/image` with `sizes`; no `unoptimized` / no `priority` on product images |
| `apps/web/components/ProductCard/ProductCardInfo.tsx` | Title/price/category | **Client**; uses `category \|\| brandName` fallback |
| `apps/web/components/CategoryNavigation/ProductsCategorySidebar.tsx` | Category rail | **Client**; SSR provides tree + nav previews |
| `apps/web/components/ProductsMobileCategoriesDrawer.tsx` | Mobile categories | **Client**; re-mounts sidebar in drawer |
| `apps/web/lib/services/products-find.service.ts` | Listing orchestration | Redis cache + DB pagination path |
| `apps/web/lib/services/products-find-listing-transform.service.ts` | Listing JSON shape | Returns 16 fields incl. `categories`, `colors`, `labels`, `description` |
| `apps/web/lib/services/products-filters.service.ts` | Facets + price range | 5E2: `buildCatalogContextWhere`, targeted option queries, aggregate price range |
| `apps/web/lib/services/products-find-query/query-builder.ts` | DB filters/sort | `buildDbOrderBy` only maps `createdAt-asc` / default desc — **not** price/name sorts |
| `apps/web/lib/cache/public-cache-ttl.ts` | TTL constants | 3600s for page + Redis |
| `apps/web/lib/services/admin/admin-products-update/cache-revalidator.ts` | Admin invalidation | `revalidateTag('products')` — **mismatch** with page tag `products-list` |
| `apps/web/components/BrandFilter.tsx` | Brand facet (orphan) | Fetches `/api/v1/products?limit=1000` |
| `apps/web/components/ColorFilter.tsx`, `SizeFilter.tsx`, `PriceFilter.tsx` | Facet UIs (orphan) | Fetch filters/price-range APIs — not used on `/products` |
| `apps/web/app/(main)/layout.tsx` | Main layout | Wraps all pages in `ClientProviders` + `MainSiteChrome` |
| `apps/web/components/ClientProviders.tsx` | Global client shell | Auth, prefetch, toast; SpinWheel only on `/` |

---

## Current `/products` page architecture

### Server vs client

| Layer | Components / functions | Notes |
|-------|------------------------|-------|
| **Server (RSC)** | `ProductsPage`, `ProductsPageMainSlot`, `ProductsPageSidebarSlot`, `getProducts`, `fetchProductsCached`, `getCategoryTreeCached`, `getCategoryNavPreviews` | Uses `searchParams` → **dynamic SSR** (`Cache-Control: no-cache, must-revalidate`) |
| **Client** | `ProductsCategoryCarousel`, `ProductCard` (+ Grid/List/Info/Actions), `ProductsShopToolbar`, `ProductsCategorySidebar`, `ProductsMobileCategoriesDrawer` | All product cards hydrate on client |
| **Global client** | `ClientProviders`, `MainSiteChrome`, Header/Footer | Shared across site |

### Data flow

```
searchParams → buildProductFilters → unstable_cache(JSON.stringify(filters))
  → productsService.findAll (Redis inside service)
  → listing transform → normalizeProduct (categories[0].title → category)
  → buildCategoryRows → slice 6 category rows/page
  → ProductsCategoryCarousel (client sort) → ProductCard
```

Parallel SSR in sidebar slot:

```
getCategoryTreeCached(lang) + getCategoryNavPreviews(lang, targets)
  → ProductsCategorySidebar (client)
```

### API calls on `/products` load

| Call | When | Notes |
|------|------|-------|
| **None from browser for listing** | SSR uses `productsService.findAll` directly | No HTTP self-fetch |
| Filters / price-range / limit=1000 | **Not called** on current `/products` | Orphan filter components not mounted |
| Category tree / nav previews | Server-side service calls | Cached via `unstable_cache` |

### Cache usage

| Layer | Key / tag | TTL | Per searchParams? |
|-------|-----------|-----|-------------------|
| `unstable_cache` (products) | `['main-products-list-v2']` + `JSON.stringify(filters)` | 3600s | **Yes** — full filter object including sort, category, colors, etc. |
| `unstable_cache` (categories) | `['products-shop-category-tree-v2']` + lang | 3600s | Per language |
| Redis (listing service) | `shop:products:v1:{hash(filters)}` | 3600s | Yes — duplicate layer inside service |
| ISR `revalidate` export | 3600 on page | — | Overridden by dynamic `searchParams` behavior |

**Invalidation gap:** Page cache tag is `products-list`; admin revalidator calls `revalidateTag('products')` only. Redis invalidation runs via `invalidateCatalogRedisCache`, but Next.js Data Cache for `unstable_cache` may stay stale up to 3600s unless `revalidatePath('/products')` clears it (path revalidation is called).

### searchParams behavior

- Parsed: `page`, `search`, `category`, `minPrice`, `maxPrice`, `colors`, `sizes`, `brand`, `sort`
- **`page` paginates category rows**, not products — product fetch is always `page=1`, `limit=120`
- With `category` filter, still fetches up to 120 products matching filter, then groups
- Sort: URL param passed to API as `sort`, but DB only honors `createdAt-*`; carousel re-sorts client-side for price/name

### ProductCard dependencies (mounted path)

- `useAddToCart`, `useCurrency`, `ProductCardLink`, `ProductCardInfo`, `ProductCardActions`, `next/image`
- Carousel strips `labels`; still passes `description`, `colors`, `compareAtPrice`, `categories` (via normalized row)

---

## Measurements

**Environment:** Local dev, `http://localhost:3000`, catalog **94** published products (`meta.total`), Phase 5D test products **absent**.

| Endpoint / page | Run 1 | Run 2 | Size | Cache-Control | Notes |
|-----------------|-------|-------|------|---------------|-------|
| `/products` (SSR HTML) | 574 ms | 460 ms | **292,863 B** | `no-cache, must-revalidate` | Dynamic page; large HTML + RSC payload |
| `/api/v1/products?page=1&limit=20` | 10,274 ms* | 10,291 ms | 11,232 B | `s-maxage=3600` | *Run 1 threw 500 then retry succeeded — cold/compile noise |
| `/api/v1/products?page=1&limit=120` | 10,131 ms | **78 ms** | 63,245 B | `s-maxage=3600` | Shop-page-equivalent payload |
| `/api/v1/products?…&colors=red` | 7,633 ms | **23 ms** | 65 B | `s-maxage=3600` | DB path; empty result (no color data in catalog) |
| `/api/v1/products?…&colors=red&sizes=L` | 9,461 ms | **25 ms** | 65 B | `s-maxage=3600` | Combined filters OK |
| `/api/v1/products/filters?lang=en` | **24 ms** | **25 ms** | 24 B | `s-maxage=3600` | `{"colors":[],"sizes":[]}` — no variant color/size in menu catalog |
| `/api/v1/products/filters?…&search=Phase%205D%20Test&minPrice=1000&maxPrice=3000` | **26 ms** | **23 ms** | 286 B | `s-maxage=3600` | Scoped query fast; test products gone → empty colors in practice |
| `/api/v1/products/price-range?lang=en` | **22 ms** | **21 ms** | 63 B | `s-maxage=3600` | Phase 5E2 aggregate + cache |
| `/api/v1/products?limit=1000` | 7,245 ms | **50 ms** | 63,246 B | `s-maxage=3600` | Caps at catalog size (~94); still cold ~7s |

**Interpretation:** Backend listing/filters APIs are **warm-fast** after Phase 5. Remaining cost is **SSR HTML size**, **cold Redis/DB on cache miss**, and **client hydration** of many `ProductCard` client components — not filters API or limit=1000 on the live page.

---

## Remaining bottlenecks

| Bottleneck | Evidence | Impact | Recommended action | Risk |
|------------|----------|--------|-------------------|------|
| `/products` always fetches **120 products** | `PRODUCTS_SHOP_LIST_LIMIT = 120`, `getProducts(1, …)` | Large SSR payload (~293 KB HTML); DB + transform on cache miss | Reduce limit when `category` set; or fetch only products needed for visible category rows; align with filtered `meta.total` | Medium — UX must preserve category-row layout |
| **Category-row pagination** vs product pagination | `ROWS_PER_PAGE = 6`; URL `page` slices rows not products | Confusing; may show subset of categories while holding 120 products in memory | Document; optional Phase 6: pass smaller limit + server sort only | Medium — product decision |
| **Client-side sort duplicate** | `ProductsCategoryCarousel` sorts; API `buildDbOrderBy` ignores price/name | CPU on client; sort not global across categories | Extend `buildDbOrderBy` + remove carousel sort **or** keep client sort and document | Medium |
| **Heavy client boundary** | `ProductCard` + carousel + sidebar all `'use client'` | Large JS hydration on `/products` | Slim props to carousel; optional `dynamic()` for carousel; server sort to reduce client work | Low–Medium |
| **RSC payload bloat** | API returns `description`, `colors`, `labels`, full `categories[]`; carousel strips some | Bytes over the wire to client | Map to slim `CatalogCardProduct` before passing to client components | Low |
| **`unstable_cache` tag mismatch** | Page tag `products-list`; admin `revalidateTag('products')` | Stale SSR listing up to TTL after admin edit | Add `revalidateTag('products-list')` in cache revalidator | **Low** — safe fix |
| **Decorative raw `<img>`** on products page | 3× `union-decorative.png` via `<img src={toR2Url(...)}>` | Unoptimized, no lazy hints | Use `next/image` with lazy loading or CSS background | Low |
| **BrandFilter limit=1000** | `BrandFilter.tsx` line 81 | Would be ~7s cold if mounted | **Postpone** — not mounted; future dedicated brands facet API | N/A today |
| **Orphan facet components** | No imports for Color/Size/Price/Brand filters | Dead code / future UI | Do not mount in Phase 6 unless filter drawer is in scope | Scope creep |
| **Double cache layers** | `unstable_cache` + Redis in `findAll` | Complexity; harder to debug | Optional: rely on one layer for SSR path | Low priority |

---

## Client bundle / client component findings

### Client-heavy on `/products` path

| Component | Role | Lazy-load candidate? |
|-----------|------|---------------------|
| `ProductCard.tsx` | Every visible card | Partial — hard to split without RSC refactor |
| `ProductsCategoryCarousel.tsx` | Grid + expand rows | **Yes** — `dynamic(..., { ssr: true })` |
| `ProductsShopToolbar.tsx` | Sort UI | Small; optional dynamic |
| `ProductsCategorySidebar.tsx` | Desktop nav | Already SSR-fed; client for scroll/interaction |
| `ProductsMobileCategoriesDrawer.tsx` | Mobile drawer | **Yes** — below fold / on interaction |

### Orphan / unused filters

| Component | Mounted? | API if mounted |
|-----------|----------|----------------|
| `ColorFilter` | **No** | `/api/v1/products/filters` |
| `SizeFilter` | **No** | `/api/v1/products/filters` |
| `PriceFilter` | **No** | `/api/v1/products/price-range` |
| `BrandFilter` | **No** | `/api/v1/products?limit=1000` |

`ProductsShopToolbar` “Filter” button only toggles **name sort** options — not connected to facet components.

### Global providers affecting `/products`

- `ClientProviders`: Auth, `CoreRoutePrefetch`, Toast — always loaded
- Spin wheel **not** loaded on `/products` (pathname guard) — Phase 2 win preserved

### Build analysis

`npm run build --workspace=@shop/web` **succeeded**. Route table shows:

- `/products` → `ƒ` (Dynamic) server-rendered on demand
- No static First Load JS size line in this Next.js output format (dynamic route)

---

## BrandFilter finding

| Question | Answer |
|----------|--------|
| **Mounted?** | **No** — `BrandFilter` only referenced in its own file |
| **Current bottleneck?** | Latent only — `limit=1000` cold ~7.2s, warm ~50ms, ~63 KB (full catalog) |
| **Should fix now?** | **No** — not on production path |
| **Recommended action** | Postpone until filter drawer UI ships; then add `/api/v1/products/brands` facet or extend filters API — **not** `limit=1000` scrape |

---

## ProductCard contract finding

### API fields (live `limit=5`)

```
brand, categories, colors, compareAtPrice, defaultVariantId, description,
discountPercent, id, image, inStock, labels, originalPrice, price, slug, stock, title
```

**No top-level `category` field** — only `categories[]`.

### UI usage

| Field | ProductCard needs? | Source today |
|-------|-------------------|--------------|
| `category` (string) | Display only — `ProductCardInfo` line 69 | Page `normalizeProduct`: `categories?.[0]?.title ?? ''` |
| `categories[]` | Page grouping only | API + page normalization |

| Question | Answer |
|----------|--------|
| **category required?** | **No** at API level — page derives it |
| **categories used?** | Page grouping + normalization |
| **Action needed?** | **Document only / optional type cleanup** — align TS types with `categories[0].title`; no API payload change required |
| **Risk** | Adding redundant `category` to API would increase payload with no benefit |

**Unused on `/products` carousel path:** `labels` (stripped), `colors` (passed but `_colors` unused in Info), `description` (optional display).

---

## Image optimization finding

| Question | Answer |
|----------|--------|
| **Unoptimized on `/products` path?** | **Yes** — page shell uses 3× raw `<img>` for decorative `union-decorative.png` (not `next/image`) |
| **ProductCard images** | `ProductCardGrid` uses `next/image` with `sizes` (`200px` / `223px` / mobile variants); **no** `unoptimized`; **no** `priority` on listing cards (good) |
| **Safe action for Phase 6** | Convert decorative backgrounds to lazy `next/image` or static CSS — **small, low risk** |
| **Postpone** | Home/mobile `unoptimized` usages (off `/products` path); category icon `unoptimized` in sidebar |

---

## Phase 5D test data cleanup

| Question | Answer |
|----------|--------|
| **Still in dev DB?** | **No** — `search=Phase 5D Test` → `meta.total=0`; cleanup dry-run: **0 test products matched** |
| **Affects product count?** | **No** — catalog `meta.total=94` |
| **Affects filters default?** | **No color/size facets** in real menu catalog (`filters?lang=en` → empty arrays) |
| **Still needed for Phase 6?** | **No** — implementation validation for 5D/5E is done and pushed |
| **Cleanup recommendation** | **No DB action** — data already absent |
| **Cleanup timing** | Keep local scripts uncommitted for future regression; **do not run apply** unless re-seeding for tests |
| **Note** | Prior reports assumed 97 products (94 + 3 test); current dev DB is **94 only** |

---

## Cache behavior after Phase 5E2

| Endpoint | Cold (novel key) | Warm | Structural scan removed? |
|----------|------------------|------|--------------------------|
| `/filters` | ~24 ms (cached/empty catalog) | ~24 ms | **Yes** — targeted queries in `products-filters.service.ts` |
| `/price-range` | ~22 ms | ~21 ms | **Yes** — `productVariant.aggregate` |
| Listing API | ~7–10 s cold miss | ~23–78 ms | **Yes** — DB pagination + listing select |

Redis + HTTP `s-maxage=3600` active on all three. Admin product updates call `invalidateCatalogRedisCache` (includes `shop:filters:*`, `shop:price-range:*`) and `revalidatePath('/products')`.

---

## Recommended Phase 6 implementation plan

**One combined phase is safe** for page-level cleanup that does **not** require new filter UI or catalog schema changes.

### Phase 6 Implementation — Products Page Remaining Performance Cleanup

**Goal:** Reduce `/products` SSR weight and client hydration cost; fix cache tag mismatch; small image cleanup — **without** mounting orphan filters or changing catalog API contracts.

**Max files expected:** ~8–12

#### Tasks

1. **Fix Data Cache tag alignment**  
   - In `cache-revalidator.ts` (and create path if needed): `revalidateTag('products-list')` alongside existing `products` tag.  
   - Verify admin product update clears `/products` listing cache.

2. **Reduce SSR listing over-fetch**  
   - When `category` (or heavy filters) is in URL, lower `PRODUCTS_SHOP_LIST_LIMIT` or use `meta.total` cap (e.g. `Math.min(120, total)`).  
   - Avoid fetching 120 rows when filtered set is smaller.

3. **Slim client serialization**  
   - Introduce a minimal type (e.g. `CatalogCardProduct`) with only fields `ProductCard` + carousel need: `id`, `slug`, `title`, `price`, `compareAtPrice`, `image`, `inStock`, `defaultVariantId`, `stock`, `brand`, `category` (string), optional `description`.  
   - Map in `ProductsPageMainSlot` before passing to `ProductsCategoryCarousel`.  
   - Drop `colors`, `categories[]`, `labels` from client props on this path.

4. **Sort strategy (pick one in implementation)**  
   - **Preferred:** Extend `buildDbOrderBy` for `price-asc`, `price-desc`, `name-asc`, `name-desc` (may need variant price subquery pattern already used elsewhere) and **remove** client sort from `ProductsCategoryCarousel` when server sort matches.  
   - **Fallback (lower risk):** Keep client sort; document as known duplication.

5. **Lazy-load non-critical client UI**  
   - `dynamic()` import for `ProductsMobileCategoriesDrawer` (ssr: false or load on open).  
   - Optional: dynamic `ProductsCategoryCarousel` with loading skeleton.

6. **Decorative image cleanup on products page**  
   - Replace 3× raw `<img>` decorative assets with lazy `next/image` (no priority) or optimized static background.

#### Do together because

- All touch the `/products` page boundary (SSR → client props → hydration).  
- No dependency on facet UI or BrandFilter.  
- Complements Phase 5 backend work without revisiting query-builder filters.

#### Do not include

- Mounting `ColorFilter` / `SizeFilter` / `PriceFilter` / `BrandFilter`  
- New brands facet API (`limit=1000` workaround)  
- Category-row vs product-level pagination redesign (needs product owner sign-off)  
- Phase 5D seed/cleanup script execution  
- Meilisearch / facet index work  
- Home/mobile global `unoptimized` image sweep  
- Removing Redis listing cache or filters aggregate code

#### Tests

1. `/products` default — loads, category rows render, add-to-cart works.  
2. `/products?category=<slug>` — filtered rows, no regression in counts.  
3. Sort: `price-asc`, `price-desc`, `name-asc`, `name-desc` — order correct within each category row.  
4. Pagination `?page=2` — category row pages advance.  
5. Admin edit product → `/products` reflects change within invalidation (not stale 3600s if tag fix works).  
6. Cold vs warm SSR timing (optional baseline).  
7. Mobile drawer still opens categories.

#### Stop conditions

1. Category-row layout breaks or wrong products appear under category headers.  
2. Sort behavior regresses vs current client-side sort baseline.  
3. `revalidateTag('products-list')` causes build/runtime errors in Next.js version in use.  
4. Slim props remove a field actually used by `ProductCard`/`useAddToCart` (stock, defaultVariantId, price).  
5. SSR limit reduction hides categories that should appear on unfiltered page.  
6. Any requirement to ship facet filter drawer emerges mid-phase — **stop and split** filter UI to Phase 7.

#### Suggested commit message

```
perf(products): trim shop page SSR payload and fix listing cache tags
```

**Combined implementation safe:** **yes** (with sort task using fallback if DB orderBy proves risky)

**Risk level:** **Low–Medium**

---

## Postponed items

| Item | Reason |
|------|--------|
| BrandFilter / `limit=1000` | Not mounted |
| Facet filter drawer (Color/Size/Price) | No UI on `/products`; large product scope |
| API `category` field | Page normalization sufficient |
| Category-row vs product pagination redesign | UX decision |
| Phase 5D test data cleanup | Already absent from DB |
| DB sort for price/name (if fallback chosen) | Can defer to Phase 7 |
| Full RSC ProductCard (server component cards) | Large refactor |
| Home/mobile `unoptimized` images | Out of `/products` scope |

---

## Summary

| Item | Finding |
|------|---------|
| **Main bottleneck now** | `/products` SSR payload + client hydration — not filters API |
| **Listing/filters APIs** | Phase 5 complete; warm times ~20–80 ms |
| **BrandFilter** | Orphan; ignore until UI exists |
| **ProductCard contract** | `categories[]` + page-derived `category` — no API change needed |
| **Images** | ProductCard OK; page decorative `<img>` still unoptimized |
| **Phase 5D test data** | Already removed from dev DB |
| **Phase 6** | Single page-focused cleanup phase recommended |

**One-sentence recommendation:** Phase 5 fixed catalog APIs — Phase 6 should shrink what `/products` fetches and ships to the client (slim props, smarter limit, cache tag fix, lazy secondary UI), and postpone all orphan facet/BrandFilter work until filter UI is actually mounted.
