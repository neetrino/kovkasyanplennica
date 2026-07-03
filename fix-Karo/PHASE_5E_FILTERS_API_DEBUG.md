# Phase 5E Filters API / Price Range Debug

**Date:** 2026-07-02  
**Branch:** `dev-Karo`  
**Phase type:** DEBUG / AUDIT ONLY — no production code changes  
**Scope:** `/api/v1/products/filters`, `/api/v1/products/price-range`, filter UI consumers, Redis/cache strategy, aggregate/groupBy feasibility

---

## Git state

| Item | Value |
|------|-------|
| **Branch** | `dev-Karo` |
| **Tracking** | Up to date with `origin/dev-Karo` |
| **Latest commits** | `a444410` perf(products): move color and size filters to database · `40d6df0` perf(products): use lightweight catalog listing query · `f16dee1` perf(products): move price and brand filters to database · `7b46777` perf(products): paginate catalog queries in database |
| **Local debug/test files** | Pre-existing untracked: `PHASE_1A_*`, `PHASE_4_*`, `PHASE_5D_*`, `scripts/phase5d-*`; modified: `PHASE_1_DEBUG_STATUS.md` |
| **Production code changed** | **no** |

---

## Prior reports confirmed

| Finding | Confirmed |
|---------|-----------|
| Phase 4: `/api/v1/products/filters` does full-catalog `findMany` + in-memory facet building | **Yes** — unchanged in Phase 5D |
| Phase 4: `/api/v1/products/price-range` scans products/variants | **Yes** — unchanged |
| Phase 5D test data: red, blue, green / M, L, S | **Yes** — visible in filters API |
| Phase 5D: listing color/size filters moved to DB `where` | **Yes** — `query-builder.ts` only; filters service untouched |
| Filters API itself not changed in Phase 5D | **Yes** |

---

## Files inspected

| File | Purpose | Relevant findings |
|------|---------|-------------------|
| `apps/web/app/api/v1/products/filters/route.ts` | Filters route | Parses `category`, `search`, `minPrice`, `maxPrice`, `lang`; delegates to `productsService.getFilters`; **no `Cache-Control` header** |
| `apps/web/app/api/v1/products/price-range/route.ts` | Price range route | Parses only `category`, `lang`; **no `search`/`minPrice`/`maxPrice`**; no cache headers |
| `apps/web/lib/services/products-filters.service.ts` | Facet + price-range logic | Unbounded `findMany`, in-memory facets/price; duplicated category lookup (not `category-utils`) |
| `apps/web/lib/services/products.service.ts` | Facade | Delegates `getFilters` / `getPriceRange` to `productsFiltersService` |
| `apps/web/lib/services/products-find-query/query-builder.ts` | Listing DB filters (Phase 5B–5D) | Has `buildPriceFilter`, `buildColorSizeFilter`, `buildCategoryFilter` via `findCategoryBySlug` — **not reused by filters service** |
| `apps/web/lib/services/products-find-query/category-utils.ts` | Category slug resolution | Locale fallback + recursive child IDs — **listing uses this; filters service does not** |
| `apps/web/lib/cache/with-redis-cache.ts` | Redis wrapper | Available; memory fallback when Redis unavailable |
| `apps/web/lib/cache/redis-keys.ts` | Key helpers | `productListKey`, patterns for products/slugs/categories/search/settings — **no filters/price-range keys** |
| `apps/web/lib/cache/redis-invalidate.ts` | Catalog invalidation | `invalidateCatalogRedisCache` clears `shop:products:*` etc. — **does not clear filters/price-range keys today** |
| `apps/web/lib/cache/public-cache-ttl.ts` | TTL constants | `CATALOG_REDIS_TTL_SECONDS = 3600` |
| `apps/web/lib/services/cache.service.ts` | Low-level Redis | `deletePattern` via `KEYS` + `DEL`; supports Upstash and ioredis |
| `apps/web/components/ColorFilter.tsx` | Color facet UI | Fetches `/api/v1/products/filters` with `lang`, `category`, `search`, `minPrice`, `maxPrice`; sends lowercase `colors=` to URL |
| `apps/web/components/SizeFilter.tsx` | Size facet UI | Same filters API; sends uppercase `sizes=` |
| `apps/web/components/BrandFilter.tsx` | Brand facet UI | Fetches `/api/v1/products?limit=1000` — **separate bottleneck, out of 5E scope** |
| `apps/web/components/PriceFilter.tsx` | Price slider UI | Fetches `/api/v1/products/price-range` with `lang`, `category` only (no search) |
| `apps/web/app/(main)/products/page.tsx` | Shop page | Parses `colors`/`sizes`/`minPrice`/`maxPrice` from URL into listing filters; **does not mount ColorFilter/SizeFilter/BrandFilter/PriceFilter** |

---

## Current routes

| Route | Query params | Service | Cache headers | Redis cache | Risk level |
|-------|--------------|---------|---------------|-------------|------------|
| `GET /api/v1/products/filters` | `category`, `search`, `minPrice`, `maxPrice`, `lang` (default `en`) | `productsFiltersService.getFilters` | **None** | **No** | **High** |
| `GET /api/v1/products/price-range` | `category`, `lang` (default `en`) | `productsFiltersService.getPriceRange` | **None** | **No** | **High** |

---

## `/api/v1/products/filters` current behavior

### Response shape

```json
{
  "colors": [
    { "value": "blue", "label": "blue", "count": 1, "imageUrl": null, "colors": [] }
  ],
  "sizes": [
    { "value": "S", "count": 1 }
  ]
}
```

- **Color facet:** `value` = lowercase key; `label` = display (prefers capitalized); optional `imageUrl`, `colors` (hex array from AttributeValue).
- **Size facet:** `value` = uppercase; `count` only.
- **Counts:** Incremented **per matching variant option row**, not per product (e.g. `red` count = 2 because Products A and B each have a red variant).
- **Sorting:** Colors alphabetical by label; sizes by `XS…XXXL` order then localeCompare.

### Live API results (Phase 5D test data present)

| Request | Colors | Sizes | Notes |
|---------|--------|-------|-------|
| `?lang=en` | blue, green, red | S, M, L | 304 bytes |
| `?lang=ru` | same values | same | Identical counts (test translations same across locales) |
| `?lang=hy` | same | same | Identical |
| `?search=Phase%205D%20Test` | blue, green, red | S, M, L | Scoped to 3 test products |
| `?maxPrice=3000` | blue, red (+ green count 0) | M, L | Green/S dropped (Product C @ 4000 excluded); green kept with count 0 via `productAttributes` merge |
| `?minPrice=1000&maxPrice=3000` | same as maxPrice=3000 | M, L | Price filter uses min **published variant price** per product |
| `?category=sousy&lang=en` | 3 colors | 3 sizes | **Category filter NOT applied** (slug not found for `en`) — full-catalog scan |
| `?category=sousy&lang=ru` | **0** | **0** | Category filter applied — 14 sauce products, no color/size options |
| `?category=nonexistent-slug-xyz` | 3 colors | 3 sizes | Unknown category silently ignored (same as no category) |

### Category / search / price behavior

| Param | Applied in DB `where`? | Applied in JS? | Notes |
|-------|------------------------|----------------|-------|
| `search` | Yes (`translations`, `subtitle`, variant `sku`) | — | Works |
| `category` | Yes, if slug found for **exact `lang` only** | — | **Does not use `findCategoryBySlug` fallback** — misaligned with listing API for `lang=en` + `category=sousy` |
| `minPrice` / `maxPrice` | **No** | Yes — filters products by min variant price | Semantics match listing Phase 5B (min published variant price) |
| `colors` / `sizes` / `brand` | Not accepted by route | — | N/A |

### DB query pattern (`getFilters`)

| Question | Answer |
|----------|--------|
| Calls `findMany`? | **Yes** — unbounded, no `take`/`skip` |
| Product translations loaded? | **No** |
| Variants loaded? | **Yes** — `published: true` only |
| Variant options loaded"] attributeValue + attribute + translations? | **Yes** |
| `productAttributes` tree loaded? | **Yes** — used to enrich color `imageUrl`/`colors` (can set count 0) |
| Category/search in DB? | Yes (when category resolves) |
| Price in DB? | **No** — in-memory after fetch |
| Facets computed in memory? | **Yes** — `colorMap` / `sizeMap` iteration |
| Cache? | **None** (no Redis, no HTTP `Cache-Control`) |

### Phase 5D test data effect

- Default facets are **dominated by test products** (only SKUs with color/size options in dev DB).
- Main menu catalog (~94+ products) contributes empty color/size facets.
- Test data makes filters API **appear functional** in dev; without cleanup script data, facets were empty but full scan still ran (~1.2s in Phase 4).

---

## `/api/v1/products/price-range` current behavior

### Response shape

```json
{
  "min": 0,
  "max": 7000,
  "stepSize": null,
  "stepSizePerCurrency": null
}
```

### Live API results

| Request | min | max | Notes |
|---------|-----|-----|-------|
| (default) | 0 | 7000 | Full catalog |
| `?category=sousy` | 0 | 7000 | Same as default in `lang=en` (category likely not resolved — same locale bug) |
| `?search=Phase%205D%20Test` | 0 | 7000 | **`search` ignored** — route does not pass it |
| `?minPrice=1000` | 0 | 7000 | **Ignored** |
| `?maxPrice=3000` | 0 | 7000 | **Ignored** |

### Price semantics

- Uses **raw `variant.price`** across **published variants only**.
- Per product: min/max of that product's variant prices; then global min/max across products.
- **No discount** applied (matches listing Phase 5B raw price filter).
- Rounding: `min = floor(min / 1000) * 1000`, `max = ceil(max / 1000) * 1000`; empty catalog → `{ min: 0, max: 100000 }`.
- Test products (1000–4000) do not change max; full catalog drives `max: 7000`.
- Loads `adminService.getPriceFilterSettings()` for `stepSize` / `stepSizePerCurrency` (null in dev).

### Category / search behavior

| Param | Supported? |
|-------|------------|
| `category` | Partial — single category ID only, **no recursive children**, strict locale slug match |
| `search` | **No** |
| `minPrice` / `maxPrice` | **No** |

### DB query pattern (`getPriceRange`)

| Question | Answer |
|----------|--------|
| Calls `findMany`? | **Yes** — all matching products |
| Loads all variants? | **Yes** — published only, price field only |
| Computes min/max in JS? | **Yes** |
| Prisma `aggregate` possible? | **Yes** — `_min`/`_max` on `productVariant.price` with `product: { where }` |
| Cache? | **None** |

---

## UI consumers

| Component | Mounted on `/products`? | API | Params sent |
|-----------|-------------------------|-----|-------------|
| `ColorFilter` | **No** — no imports anywhere | `GET /api/v1/products/filters` | `lang`, `category`, `search`, `minPrice`, `maxPrice` |
| `SizeFilter` | **No** | Same | Same |
| `BrandFilter` | **No** | `GET /api/v1/products?limit=1000` | `lang`, `category`, `search`, `minPrice`, `maxPrice` |
| `PriceFilter` | **No** | `GET /api/v1/products/price-range` | `lang`, `category` |

- `/products` page reads `colors`, `sizes`, `minPrice`, `maxPrice`, `brand` from URL and passes to listing API — filter drawer components are **orphan / future UI**.
- `ProductsHeader` detects active filter query keys but does not render facet components.

**Production impact today:** Filters/price-range APIs are cold-path unless another surface mounts these components or external clients call them. Bottleneck is still real for any caller and for future filter UI.

---

## Baseline measurements

**Environment:** Local dev, `http://localhost:3000`, ~97 published products (94 menu + 3 Phase 5D test), Neon DB.

| Endpoint | Run 1 | Run 2 | Size | Notes |
|----------|-------|-------|------|-------|
| `/api/v1/products/filters?lang=en` | **2201 ms** | **2346 ms** | 304 B | No improvement — **no server cache** |
| `/api/v1/products/filters?lang=en&search=Phase%205D%20Test` | **2158 ms** | **4155 ms** | 304 B | Still ~2s+; full scan cost dominates |
| `/api/v1/products/price-range` | **2227 ms** | **2931 ms** | 63 B | No cache; loads all products + variants |
| `/api/v1/products/price-range?search=Phase%205D%20Test` | **1090 ms** | **1181 ms** | 63 B | **`search` ignored** — same full scan, variance only |

- **No `Cache-Control` response header** on either route (contrast: `/api/v1/products` uses `s-maxage=3600`).
- Repeat requests do not reliably warm faster — confirms uncached DB-heavy path each time (unlike listing Redis path).

---

## Cache-first feasibility

| Question | Answer |
|----------|--------|
| **Safe to add Redis cache now?** | **Yes** — low regression risk if keyed correctly and invalidated with catalog |
| **`withRedisCache` available?** | Yes — same pattern as `products-find.service.ts` |
| **Key shape (recommended)** | `shop:filters:v1:{sha256({ lang, category, search, minPrice, maxPrice })}` · `shop:price-range:v1:{sha256({ lang, category })}` — extend when route gains `search` |
| **TTL** | **3600s** — align with `CATALOG_REDIS_TTL_SECONDS` and listing API |
| **Include in key** | `lang`, `category`, `search`, `minPrice`, `maxPrice` — **not** `colors`/`sizes`/`brand` (facets describe available options for current context, not current facet selection) |
| **Share invalidation with listing?** | Yes — extend `invalidateCatalogRedisCache` with `shop:filters:*` and `shop:price-range:*` patterns |
| **Wildcard deletes** | Supported via `cacheService.deletePattern` (`KEYS` + `DEL`) |
| **HTTP Cache-Control enough?** | Helps CDN/browser but **not sufficient alone** — every miss still hits Neon; server-side Redis needed for same reason as listing |
| **Stale facets 3600s after admin update?** | **Acceptable** — same policy as product listing today; must hook invalidation on admin product create/update (already calls `invalidateCatalogRedisCache`) |
| **Phase 5D test data in dev** | Cached responses will include test facets until cleanup or TTL/invalidation — dev-only concern |
| **Invalidation risk** | **Medium** — forgetting new key patterns leaves stale facets until TTL; must add patterns before enabling cache |
| **Files likely to change (5E1)** | `products-filters.service.ts`, `redis-keys.ts`, `redis-invalidate.ts`, optionally `filters/route.ts` + `price-range/route.ts` for HTTP headers |

---

## Aggregate / groupBy feasibility

### Filters / facets

| Question | Answer |
|----------|--------|
| **Query colors/sizes from `ProductVariantOption`?** | **Yes** — join `variant → product` with shared `where` |
| **Constrain to products matching filters?** | **Yes** — reuse `buildWhereClause` from `query-builder.ts` (minus self-referential color/size params) |
| **`published` + `deletedAt` on product?** | `product.published`, `product.deletedAt: null`; variant `published: true` |
| **Category/search/price context?** | Reuse query-builder; **fix category** via `findCategoryBySlug` + recursive children |
| **Locale labels?** | Post-query or SQL: resolve `attributeValue.translations` for `lang`; facet `value` stays lowercase/uppercase normalized |
| **Counts accurate?** | **Careful** — current semantics count **variant-option occurrences**, not distinct products. `groupBy` on option value must match that or be an intentional improvement (document if changed) |
| **`productAttributes` color enrichment?** | Separate query or left join — today can add colors with count 0 |
| **Prisma nested `groupBy`?** | Limited — likely **two queries** (colors, sizes) with `findMany` + distinct or `$queryRaw` |
| **Raw SQL needed?** | **Optional** — Prisma can work with 2–3 targeted queries; raw SQL cleaner for single-pass facet counts at scale |
| **Too risky for one phase?** | **Medium risk** — category locale bug + count semantics + dual legacy/new option format |

### Price range

| Question | Answer |
|----------|--------|
| **`productVariant.aggregate({ _min, _max })`?** | **Yes** |
| **Apply category/search context?** | Via `product: { ...where }`; need shared where builder + category children |
| **Discounted price?** | **Ignored today** — aggregate raw `price` only |
| **Safe to replace full scan now?** | **Yes** — simpler than facets; lower risk |

| Assessment | Filters full scan | Price-range full scan |
|------------|-------------------|----------------------|
| **Safe to replace now?** | **Yes, with tests** | **Yes** |
| **Prisma aggregate possible?** | Partial (facets); price-range full yes | **Yes** |
| **Raw SQL needed?** | Possibly for optimal single query | **No** |
| **Risk level** | **Medium** | **Low–Medium** |
| **Files likely to change (5E2)** | `products-filters.service.ts`, new `products-filters-query.ts` or extend `query-builder.ts`, `category-utils.ts` reuse |

---

## Recommended next plan

### **C. Split implementation**

#### Phase 5E1 — Redis cache (do first)

1. Wrap `getFilters` and `getPriceRange` in `withRedisCache` with keys/TTL above.
2. Add `shop:filters:*` and `shop:price-range:*` to `REDIS_CACHE_PATTERNS` + `invalidateCatalogRedisCache`.
3. Add HTTP `Cache-Control: s-maxage=3600` on both routes (parity with listing).
4. **Expected benefit:** ~2s cold → ~ms warm for repeated facet contexts; no semantic change.
5. **Risk:** Low.

#### Phase 5E2 — DB aggregate / shared where (second)

1. Extract shared catalog `where` builder for filters/price-range (reuse `findCategoryBySlug`, recursive categories, search, price-in-DB).
2. Replace `getPriceRange` scan with `db.productVariant.aggregate`.
3. Replace `getFilters` scan with targeted option queries + in-memory label merge (or SQL groupBy).
4. Fix category locale fallback bug as part of shared where (observed: `lang=en&category=sousy` wrong, `lang=ru` correct).
5. Optionally add `search` to price-range route if `PriceFilter` needs it later.
6. **Risk:** Medium — validate facet counts vs listing totals; golden vectors from Phase 5D test data.

### Why not A or B alone?

- **Cache-only (A)** leaves ~2s cold path and does not fix category misalignment or price-range param gaps.
- **Aggregate-only (B)** helps cold path but repeat traffic still hammers DB without 5E1.
- **Split (C)** delivers fast win with low risk, then structural fix.

### Is implementation safe now?

| Sub-phase | Safe? |
|-----------|-------|
| **5E1 cache** | **Yes** |
| **5E2 aggregate** | **Yes with preconditions** — reuse `category-utils`, preserve count/price semantics, run Phase 5D golden vectors + category locale matrix |

---

## Stop conditions for implementation

Stop and request review if:

1. **Facet counts diverge** from current API for Phase 5D golden contexts after aggregate rewrite.
2.4. **Category-scoped facets** disagree between listing `meta.total` and facet emptiness (e.g. `lang=en&category=sousy` must match listing behavior after shared where).
3. **Cache invalidation** test fails — admin product update still serves old facets after `invalidateCatalogRedisCache`.
4. **Count semantics change** (per-product vs per-variant-option) without explicit product-owner approval.
5. **New Redis key patterns** not added to `invalidateCatalogRedisCache` before deploy.
6. **`productAttributes` color enrichment** (imageUrl / count-0 colors) regresses after aggregate path.
7. **Price-range rounding** (`floor`/`ceil` to 1000) changes without sign-off.
8. **Attempt to fix BrandFilter** via filters API expands scope — BrandFilter uses listing API (`limit=1000`); treat separately.

---

## Summary

| Item | Finding |
|------|---------|
| **Filters API bottleneck** | Unbounded `findMany` + deep variant/option includes + in-memory facet build (~2.2s local cold) |
| **Price-range bottleneck** | Unbounded `findMany` + JS min/max (~2.2s local cold); ignores `search`/price params |
| **Redis/cache currently** | **None** on filters/price-range; listing uses `withRedisCache` 3600s |
| **Aggregate feasibility** | Price-range: **straightforward**; facets: **feasible** with shared where + careful counts |
| **Category bug** | Filters service strict locale slug — misaligned with listing for some `lang` + `category` pairs |
| **UI consumers** | ColorFilter/SizeFilter/BrandFilter/PriceFilter **not mounted** on `/products`; APIs still callable |
| **Phase 5D test data** | Inflates default facets (red/blue/green, M/L/S); cleanup script available |
| **Recommended plan** | **C — 5E1 cache first, then 5E2 aggregate + shared where** |
| **Risk level** | 5E1: **Low** · 5E2: **Medium** |

**One-sentence recommendation:** Add Redis + HTTP cache to filters and price-range immediately (5E1), then replace full-catalog scans with shared `query-builder` where clauses and DB aggregates (5E2), fixing category locale parity along the way.
