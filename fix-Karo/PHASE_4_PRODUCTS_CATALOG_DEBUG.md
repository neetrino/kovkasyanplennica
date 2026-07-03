# Phase 4 Products Catalog Performance Debug

**Date:** 2026-07-02  
**Branch:** `dev-Karo`  
**Phase type:** DEBUG / AUDIT ONLY — no production code changes  
**Scope:** Public `/products` catalog, `/api/v1/products`, `/api/v1/products/filters`, ProductCard data shape, Meilisearch, Redis/cache

---

## Git state

| Item | Value |
|------|-------|
| **Branch** | `dev-Karo` |
| **Tracking** | Up to date with `origin/dev-Karo` |
| **Latest commits** | `a6eccea` perf: enable next image optimization · `6bb7738` perf: lazy load spin wheel popup · `109af76` fix(admin): complete phase 1 product list cleanup |
| **Uncommitted files before phase** | `PHASE_1_DEBUG_STATUS.md` (modified), `PHASE_1A_DEBOUNCE_DEBUG.md`, `PHASE_1A_VERIFICATION.md`, `PHASE_1B_STOCK_FILTER_DEBUG.md` (untracked) |
| **Phase 1 debug markdown untouched** | Yes — only pre-existing local debug files; none modified during Phase 4 |

---

## Public products route map

| Route / file | Function / component | Purpose | Risk level |
|--------------|----------------------|---------|------------|
| `apps/web/app/(main)/products/page.tsx` | `ProductsPage`, `getProducts`, `fetchProductsCached` | SSR shop page; loads up to 120 products via service + `unstable_cache`; groups by category; paginates category **rows** (6/page) in memory | **High** |
| `apps/web/app/(main)/products/page.tsx` | `ProductsPageSidebarSlot` | Category tree + nav preview images (parallel Suspense) | Medium |
| `apps/web/components/ProductsCategoryCarousel.tsx` | `ProductsCategoryCarousel` | Client carousel; client-side sort within each category row; strips `labels` before ProductCard | Low (CPU only) |
| `apps/web/components/ProductsShopToolbar.tsx` | `ProductsShopToolbarInner` | URL sort/filter UI (name/price sort via query params) | Low |
| `apps/web/components/ProductCard.tsx` | `ProductCard` | Listing card (grid/list) | Low |
| `apps/web/app/api/v1/products/route.ts` | `GET` | Public catalog JSON API; delegates to `productsService.findAll` | **High** |
| `apps/web/lib/services/products.service.ts` | `findAll`, `getFilters` | Facade to find / filters / slug services | — |
| `apps/web/lib/services/products-find.service.ts` | `findAll`, `findAllUncached` | Redis cache → fetch → in-memory filter/sort/paginate → transform | **High** |
| `apps/web/lib/services/products-find-query.service.ts` | `buildQueryAndFetch` | Builds Prisma `where`, calls executor | **High** |
| `apps/web/lib/services/products-find-query/query-builder.ts` | `buildWhereClause` | DB filters: published, search, category, new/featured/bestseller | Medium |
| `apps/web/lib/services/products-find-query/query-executor.ts` | `executeProductQuery` | `findMany` with deep `include`, `take = min(limit×10, 4000)` | **Critical** |
| `apps/web/lib/services/products-find-filter.service.ts` | `filterProducts` | In-memory price, brand, color, size filter + sort | **High** |
| `apps/web/lib/services/products-find-transform.service.ts` | `transformProducts` | Maps DB rows → API/card JSON (discounts, colors, labels) | **High** |
| `apps/web/lib/services/products-find-meilisearch.service.ts` | `tryFetchProductsViaMeilisearch` | Text search only; then heavy DB reload by IDs | Medium |
| `apps/web/app/api/v1/products/filters/route.ts` | `GET` | Color/size facets | **High** |
| `apps/web/lib/services/products-filters.service.ts` | `getFilters`, `getPriceRange` | Full-catalog `findMany` + in-memory facet build | **Critical** |
| `apps/web/app/api/v1/products/search/route.ts` | `GET` | Header overlay search → `findAll({ search })` | Medium |
| `apps/web/lib/services/search.service.ts` | `searchProducts` | Meilisearch client + Redis cache | Medium |
| `apps/web/lib/services/products-nav-preview.service.ts` | `getCategoryNavPreviews` | Lightweight preview queries for sidebar (good pattern) | Low |
| `apps/web/components/ColorFilter.tsx`, `SizeFilter.tsx` | client fetch | `GET /api/v1/products/filters` (used on other surfaces, not products toolbar) | **High** when mounted |
| `apps/web/components/BrandFilter.tsx` | client fetch | `GET /api/v1/products?limit=1000` | **High** when mounted |

---

## `/api/v1/products` current behavior

### Main route file

- `apps/web/app/api/v1/products/route.ts` — parses query params, calls `productsService.findAll(filters)`, sets `Cache-Control: s-maxage=3600`.

### Main service files

| File | Role |
|------|------|
| `products-find.service.ts` | Orchestration: Redis → Meili or DB → filter → paginate → transform |
| `products-find-query.service.ts` | `buildWhereClause` + `executeProductQuery` |
| `products-find-filter.service.ts` | Post-fetch filtering/sorting |
| `products-find-transform.service.ts` | Response shaping |
| `products-find-meilisearch.service.ts` | Optional search path |

### Query builder files

- `products-find-query/query-builder.ts` — `buildWhereClause`, `buildSearchFilter`, `buildCategoryFilter`, `buildFilterFilter`
- `products-find-query/category-utils.ts` — recursive child category IDs
- `products-find-query/query-executor.ts` — `executeProductQuery`, `getBaseInclude()`, `rawFetchTake()`

### Transformer files

- `products-find-transform.service.ts` — full listing transformer (colors, discounts, labels, categories)

### Pagination location

**In memory (JavaScript), not in DB.**

```43:45:apps/web/lib/services/products-find.service.ts
    const total = filteredProducts.length;
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);
```

DB query uses `skip: 0` and `take: rawFetchTake(limit)` only:

```8:12:apps/web/lib/services/products-find-query/query-executor.ts
const MAX_PRODUCTS_RAW_FETCH = 4000;

function rawFetchTake(limit: number): number {
  return Math.min(Math.max(limit, 1) * 10, MAX_PRODUCTS_RAW_FETCH);
}
```

Examples:

| Request `limit` | DB `take` |
|-----------------|-----------|
| 20 | 200 |
| 24 (default) | 240 |
| 120 (shop page) | **1200** |
| 400 | 4000 (cap) |

### Filtering location

| Filter | Where applied |
|--------|----------------|
| published, deletedAt | DB (`buildWhereClause`) |
| search (no Meili) | DB `contains` on translations/subtitle/SKU |
| category (+ children) | DB |
| new / featured / bestseller | DB (bestseller uses `orderItem.groupBy` first) |
| minPrice, maxPrice | **In memory** (`filterProducts`) |
| brand | **In memory** |
| colors, sizes | **In memory** (variant options scan) |

### Sorting location

**In memory** in `products-find-filter.service.ts`:

- `filter=bestseller` → order by sales rank map
- `sort === "price"` → min variant price desc (note: UI uses `price-asc` / `price-desc`, not handled here)
- else → `product[sort]` as Date (default `createdAt`)

Products shop page re-sorts client-side in `ProductsCategoryCarousel` for `price-asc`, `price-desc`, `name-*`.

### Count behavior

- `total = filteredProducts.length` after in-memory filters on the **partial DB fetch** (up to `limit×10`, max 4000).
- **Not** a separate Prisma `count()` query.
- **Incorrect totals** when matching products exceed the raw fetch cap or when filters shrink the in-memory set differently from DB.

### Cache behavior

| Layer | Key / TTL | Notes |
|-------|-----------|-------|
| Redis (`withRedisCache`) | `shop:products:v1:{sha256(filters)}` · 3600s | Includes page, limit, sort, all filters — **safe key** |
| Memory fallback | Same key in-process when Redis unavailable | Dev/local |
| Next.js `unstable_cache` (page) | `['main-products-list-v2']` + `JSON.stringify(filters)` · 3600s | Used by `/products` SSR |
| HTTP `Cache-Control` | `s-maxage=3600` on API route | CDN/browser |

Cache **masks** slow DB work on repeated identical requests; cold/miss still pays full query cost.

### Meilisearch usage

- **Listing without `search` param:** No — DB path only.
- **Listing with `search`:** Yes, if `MEILI_HOST` or `MEILISEARCH_HOST` is set (`isMeilisearchConfigured()`).
- Flow: Meili returns up to 200 IDs → `executeProductQuery` reloads full product graphs → in-memory filters/pagination still apply.
- `/api/v1/products/search` wraps `findAll({ search })`.

### Redis usage

- Product list: **yes** (`productListKey`)
- Search: **yes** (`searchKey`, 60s TTL)
- Discount settings in transform: **yes**
- Filters API: **no Redis cache**

### Over-fetch findings

| Question | Answer |
|----------|--------|
| Does it fetch all products? | **No** for list API — capped at `min(limit×10, 4000)`. |
| Does it fetch up to 4000? | **Yes** when `limit ≥ 400`. Shop page fetches **1200** (`limit=120`). |
| Does it use heavy `include`? | **Yes** — translations, brand+translations, all published variants+options+attributeValue+attribute+translations, labels, categories+translations, productAttributes tree. |
| Which relations loaded? | See `getBaseInclude()` + `getProductAttributesInclude()` in `query-executor.ts`. |
| Unused for ProductCard? | Full variant option trees, all translations, productAttributes, raw `media` array (only first image used), `discountPercent` often unused in carousel (labels stripped). |
| ProductCard getting more than needed? | **Yes** — API returns PDP-adjacent payload; transform runs heavy color/label logic per row. |

---

## Filters / facets findings

### `/api/v1/products/filters`

| Question | Answer |
|----------|--------|
| Loads full catalog? | **Yes** — `db.product.findMany({ where, include: {...} })` with **no `take`/`skip`**. |
| Loads variants/images/translations unnecessarily? | Variants+options+attributeValue loaded; no product translations/images for facets. Still O(catalog × variants). |
| Facets computed in memory? | **Yes** — iterates all products/variants/options into `colorMap` / `sizeMap`. |
| Multiple heavy queries? | Category lookup + recursive child IDs + one unbounded `findMany`. |
| Caches results? | **No** |
| Varies by category/search/price? | Yes — `where` respects category, search, min/max price (price filtered in memory after fetch). |
| DB aggregate viable? | **Yes** — `groupBy` on variant options / attribute values with `where published` would be safer. |

### `/api/v1/products/price-range` (`getPriceRange`)

- Also **`findMany` entire matching catalog** with variants — min/max computed in JS.
- Same class of bottleneck as filters.

### Safest filters optimization first

1. Add **`take` is wrong fix** — need aggregate/groupBy or cached facet snapshot.
2. **First safe win:** cache filters response in Redis keyed by `{category, search, minPrice, maxPrice, lang}` (3600s, invalidate with catalog).
3. **Second:** replace in-memory scan with SQL aggregations on variant options.

---

## ProductCard data needs

| Field | Needed by ProductCard | Currently returned | Notes |
|-------|----------------------|-------------------|-------|
| `id` | Yes | Yes | |
| `slug` | Yes | Yes | |
| `title` | Yes | Yes | |
| `image` | Yes | Yes | First processed `media` URL |
| `price` | Yes | Yes | After discount calc |
| `compareAtPrice` | Yes (strikethrough) | Yes | Carousel passes through |
| `originalPrice` | Optional | Yes | Used by `useAddToCart` |
| `discountPercent` | Optional | Yes | Shown when set |
| `inStock` | Yes | Yes | |
| `stock` | Yes (add-to-cart) | Yes | |
| `defaultVariantId` | Yes (instant cart) | Yes | |
| `brand.id`, `brand.name` | Yes | Yes | |
| `labels` | Yes (badge) | Yes | **Stripped** in `ProductsCategoryCarousel` |
| `colors` | Optional (swatches) | Yes | `_colors` unused in `ProductCardInfo` today |
| `description` | Optional | Yes | Plain-text excerpt |
| `category` | Optional (string) | Via `categories[]` | Page normalizes to `category` title |
| `categories[]` | No on card | Yes | Used by page grouping only |
| All variants | No | Loaded in DB, not in JSON | Heavy DB cost |
| All translations | No | Loaded in DB | Heavy DB cost |
| `productAttributes` | No | Loaded in DB | Heavy DB cost |

**Conclusion:** Listing should use a **lightweight DB `select` + slim transformer**; current pipeline loads full relation graph then discards most of it.

---

## Meilisearch findings

| Question | Answer |
|----------|--------|
| Used by products listing? | Only when `search` query param is set **and** host env is configured |
| Used by search endpoint? | Yes — `/api/v1/products/search` → `findAll({ search })` |
| Facets available? | **No** — index has searchable/filterable product fields, not color/size facets for shop filters |
| Safe to use in Phase 5? | **Partially** — good for text search; **not** a drop-in for price/color/size/category listing without index schema + facet work |

Configured when `MEILI_HOST` or `MEILISEARCH_HOST` is non-empty (`search-index.service.ts`). Local dev may or may not have it; listing still works via DB fallback.

---

## Redis / cache findings

| Question | Answer |
|----------|--------|
| Used by products listing? | **Yes** — Redis + in-memory via `withRedisCache` |
| Used by filters? | **No** |
| Cache keys safe? | **Yes** for list — hash of full filter object including page/limit/sort |
| Stale data risk | **Medium** — 3600s TTL on catalog; admin product changes rely on `invalidateCatalogRedisCache` (verify invalidation covers all filter combinations in Phase 5 testing) |

`unstable_cache` on `/products` page duplicates caching with same 3600s revalidate — double layer, generally safe but can hide regressions during dev.

---

## Measurements

**Environment:** Local dev server on `http://localhost:3000` (already running). Catalog ~**94** published products (`meta.total` for `limit=20`).

| Endpoint | Params | Response time | Response size | Notes |
|----------|--------|---------------|---------------|-------|
| `/api/v1/products` | `page=1&limit=20` | ~75ms cold → **36–62ms warm** | **11,232 bytes** | 20 items; keys include colors, categories, labels |
| `/api/v1/products` | `page=1&limit=20&sort=createdAt-desc` | ~**2026ms** (first run, likely cold DB/Redis) | — | Subsequent identical requests ~36ms |
| `/api/v1/products` | `page=1&limit=120` | **72–84ms warm** | **63,245 bytes** | Shop-page-equivalent payload |
| `/api/v1/products/filters` | (none) | ~**1221ms** cold → faster on repeat | **24 bytes** | `{"colors":[],"sizes":[]}` — empty facets in dev DB but still paid full scan |
| `/products` | SSR page | **~441–452ms** | — | Includes category tree + nav previews + product fetch |

**Interpretation:** Small catalog + warm cache makes API look fast locally. Architecture still **O(limit×10)** DB rows with deep includes — will not scale linearly to thousands of SKUs. Filters/price-range paths load **entire** matching catalog every request when uncached.

---

## Highest-impact safe fixes for Phase 5

### 1. Safest high-impact fix: DB-level pagination + narrow `select` for listing

| | |
|--|--|
| **Files** | `query-executor.ts`, new `products-list-select.ts` (or inline select), `products-find.service.ts`, `products-find-filter.service.ts` (move filters to `where`) |
| **Expected benefit** | Large reduction in Neon rows read and JSON payload; correct `total` via `count()` |
| **Regression risk** | **Medium** — must preserve filter semantics (category children, color/size on variants) |
| **Manual tests** | `/products` all sort modes; category filter; price/color/size/brand filters; pagination meta; add-to-cart from card |

### 2. Second fix: Replace filters API full scan with aggregates + Redis cache

| | |
|--|--|
| **Files** | `products-filters.service.ts`, `filters/route.ts`, optional `redis-keys.ts` |
| **Expected benefit** | Filters drawer / ColorFilter / SizeFilter no longer load entire catalog |
| **Regression risk** | **Low–Medium** — facet counts must match listing filters |
| **Manual tests** | `/api/v1/products/filters` with category, search, price range; compare facet counts to listing |

### 3. Third fix: Listing-specific transformer (skip heavy color/attribute walk)

| | |
|--|--|
| **Files** | `products-find-transform.service.ts` or new `products-list-transform.service.ts` |
| **Expected benefit** | Less CPU per request; smaller JSON |
| **Regression risk** | **Low** if ProductCard fields unchanged |
| **Manual tests** | ProductCard render, wishlist/compare cards, home menu |

---

## Recommended Phase 5 implementation plan

### Step 1 — Add list query module (no behavior change yet)

1. Create `apps/web/lib/services/products-find-query/list-select.ts` with minimal Prisma `select` for: product id, slug/title (one locale), first image, min variant price/stock/id/compareAtPrice, brand name, primary category, labels (if needed).
2. Add unit/integration test harness against staging DB row counts (optional).

### Step 2 — Move filters into Prisma `where`

1. Extend `query-builder.ts`:
   - Price: `variants.some { price gte/lte }` using min-price semantics.
   - Brand: `brandId in (...)`.
   - Colors/sizes: `variants.some { options.some { attributeValue... } } }`.
2. Remove corresponding blocks from `products-find-filter.service.ts` (keep sort temporarily).

### Step 3 — True pagination

1. In `products-find.service.ts`:
   - `const [products, total] = await Promise.all([findMany({ skip, take: limit }), count({ where })])`.
   - Remove `rawFetchTake` multiplier for listing path (keep cap constant as safety max `take`).
2. Preserve `meta: { total, page, limit, totalPages }` shape.

### Step 4 — Sort in DB

1. Map API sort values (`createdAt`, `price-asc`, `price-desc`, `name-asc`, `name-desc`) to Prisma `orderBy` (may require subquery or computed min price).
2. Align server sort with `ProductsCategoryCarousel` or remove duplicate client sort.

### Step 5 — Shop page alignment

1. `apps/web/app/(main)/products/page.tsx`:
   - Stop hardcoding `getProducts(1, ..., PRODUCTS_SHOP_LIST_LIMIT)` if API pagination is fixed; or fetch only categories needed for current page.
   - Reconcile category-row pagination vs product pagination (document chosen UX).

### Step 6 — Filters service

1. Replace unbounded `findMany` in `getFilters` with grouped queries on variant options.
2. Add Redis cache keyed by filter context (3600s).
3. Apply same pattern to `getPriceRange` (`aggregate min/max` on variants).

### Step 7 — Meilisearch (optional sub-phase)

1. Keep text search path; after DB pagination works, reduce post-Meili `executeProductQuery` to list `select` only.
2. Do **not** switch facet filters to Meili until index schema supports facets.

### How to test

- API: `page`, `limit`, `category`, `search`, `minPrice`, `maxPrice`, `colors`, `sizes`, `brand`, `sort`, `filter=new|featured|bestseller`.
- Pages: `/products`, `/products?category=…`, mobile drawer, pagination links.
- Cache: cold vs warm; edit product in admin → verify invalidation within TTL policy.
- Regression: `ProductCard` add-to-cart, compare/wishlist list fetches, `BrandFilter` (uses `limit=1000`).

### What NOT to touch in Phase 5

- Phase 1 debug markdown files (local only).
- Admin product list (Phase 1 scope).
- PDP slug service / full product detail includes.
- `ProductCard` UI components unless field contract changes.
- Spin wheel, hero, image optimization (Phases 2–3).

---

## Stop conditions for Phase 5

Stop implementation and request review if:

1. **`count()` and `findMany()` totals disagree** after moving filters to SQL.
2. **Color/size filters** cannot be expressed in Prisma without unacceptable query complexity — propose aggregate SQL view instead.
3. **Category-row pagination** on `/products` conflicts with product-level pagination and product owner has not chosen UX.
4. **Cache invalidation** misses cause stale prices/stock > 1 TTL cycle in staging.
5. **Meilisearch** required for production search but env not configured in staging — do not block listing fix on Meili.
6. Any change requires **schema migration** not approved beforehand.
7. Performance regression: p95 `/api/v1/products?limit=24` worse than baseline on staging with full catalog.

---

## Summary

| Item | Finding |
|------|---------|
| **Main bottleneck** | Deep Prisma `include` on up to **`limit×10` (max 4000)** rows, then filter/sort/paginate in Node; filters API loads **entire catalog** |
| **Over-fetch confirmed** | **Yes** — multiplier pattern + heavy relations; shop page `limit=120` → **1200** DB rows |
| **Filters API bottleneck** | **Yes** — unbounded `findMany` + in-memory facets |
| **Meilisearch usage** | Text search only when configured; not used for default listing or facets |
| **Redis/cache usage** | Listing + search cached (3600s / 60s); filters not cached |
| **Recommended Phase 5** | DB pagination + narrow select + SQL filters first; then filters aggregates + cache |
| **One-sentence recommendation** | Stop fetching 10× page size with full relation graphs—push filters, sort, pagination, and counts into the database with a listing-specific select, then fix the unbounded filters API. |
| **Risk level** | **High** (core catalog path) — implement incrementally with staging parity tests |
| **Files likely to change** | `query-executor.ts`, `query-builder.ts`, `products-find.service.ts`, `products-find-filter.service.ts`, `products-find-transform.service.ts`, `products-filters.service.ts`, possibly `products/page.tsx` |
