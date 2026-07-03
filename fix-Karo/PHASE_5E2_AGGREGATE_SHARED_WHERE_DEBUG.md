# Phase 5E2 Aggregate / Shared Where Debug

**Date:** 2026-07-02  
**Branch:** `dev-Karo`  
**Phase type:** DEBUG / AUDIT ONLY — no production code changes  
**Scope:** Feasibility of replacing full scans in `/api/v1/products/filters` and `/api/v1/products/price-range` with shared `where`, Prisma aggregate, and targeted facet queries

---

## Git state

| Item | Value |
|------|-------|
| **Branch** | `dev-Karo` |
| **Tracking** | Up to date with `origin/dev-Karo` |
| **Latest commits** | `7271f61` perf(products): cache filters and price range APIs · `a444410` perf(products): move color and size filters to database · `40d6df0` perf(products): use lightweight catalog listing query · `f16dee1` perf(products): move price and brand filters to database |
| **Local debug/test files** | Pre-existing untracked debug markdown + Phase 5D scripts; modified `PHASE_1_DEBUG_STATUS.md` |
| **Production code changed** | **no** |

---

## Prior reports confirmed

| Finding | Confirmed |
|---------|-----------|
| Phase 4: filters + price-range full scans | Yes — uncached path still unbounded |
| Phase 5D test data: red/blue/green, M/L/S | Yes — counts verified live |
| Phase 5D same-variant vectors | Yes — golden table in test report |
| Phase 5E: category locale mismatch, no cache on cold path | Yes |
| Phase 5E1: Redis + HTTP cache only | Yes — `withRedisCache` wraps public methods; uncached bodies unchanged |
| Recommended plan: 5E1 cache, then 5E2 aggregate/shared where | Yes |

---

## Files inspected

| File | Purpose | Relevant findings |
|------|---------|-------------------|
| `apps/web/app/api/v1/products/filters/route.ts` | Filters route | Params: `category`, `search`, `minPrice`, `maxPrice`, `lang`; `Cache-Control: s-maxage=3600` |
| `apps/web/app/api/v1/products/price-range/route.ts` | Price-range route | Params: `category`, `lang` only; same cache header |
| `apps/web/lib/services/products-filters.service.ts` | Facet + price logic | `getFilters`/`getPriceRange` cached; `getFiltersUncached`/`getPriceRangeUncached` do full scans |
| `apps/web/lib/services/products.service.ts` | Facade | Delegates to `productsFiltersService` |
| `apps/web/lib/services/products-find-query/query-builder.ts` | Listing `where` | `buildWhereClause`, `buildSearchFilter`, `buildCategoryFilter` (`findCategoryBySlug`), `buildPriceFilter`, `buildColorSizeFilter`, `buildBrandFilter` |
| `apps/web/lib/services/products-find-query/category-utils.ts` | Category resolution | Locale fallback, locale-suffixed slug retry, recursive `getAllChildCategoryIds` |
| `apps/web/lib/services/products-find-query/types.ts` | `ProductFilters` | Superset of filters API params (+ colors/sizes/brand/sort/page/limit/filter) |
| `apps/web/lib/cache/redis-keys.ts` | Cache keys (5E1) | `filtersCacheKey`, `priceRangeCacheKey`, normalize helpers — **no changes needed for 5E2** |
| `apps/web/lib/cache/redis-invalidate.ts` | Invalidation | Clears `shop:filters:*`, `shop:price-range:*` with catalog |
| `apps/web/lib/cache/with-redis-cache.ts` | Cache wrapper | Rewrite belongs inside `*Uncached` only |
| `packages/db/prisma/schema.prisma` | DB models | `Product` → `variants` → `options` → `attributeValue`; `ProductAttribute` junction; `ProductVariant.price` required `Float` |

---

## Current API contract

| Endpoint | Response shape | Cache-Control | Current behavior | Known bugs / mismatches |
|----------|----------------|---------------|------------------|-------------------------|
| `/filters?lang=en` | `{ colors[], sizes[] }` | yes | Full catalog facets (Phase 5D colors visible) | — |
| `/filters?lang=ru` | same counts | yes | Same as en for test data | — |
| `/filters?search=Phase%205D%20Test` | red=2, blue=1, green=1; M=1,L=2,S=1 | yes | Search scoped in DB | — |
| `/filters?…&minPrice=1000&maxPrice=3000` | green count=0; no S | yes | Price filtered **in memory** after fetch | green kept with count 0 (see enrichment) |
| `/filters?lang=en&category=sousy` | Full test-product facets (304 B) | yes | **Category not applied** | vs listing total=14 |
| `/filters?lang=ru&category=sousy` | `{ colors:[], sizes:[] }` | yes | Category applied (strict `ru` slug) | vs listing en+ru both total=14 |
| `/filters?category=nonexistent-slug-xyz` | Full catalog facets | yes | Unknown category **ignored** | vs listing total=0 |
| `/price-range?lang=en` | `{ min:0, max:7000, stepSize, stepSizePerCurrency }` | yes | Full catalog scan | — |
| `/price-range?lang=en&category=sousy` | `{ min:0, max:7000 }` | yes | Category **not applied** (en slug miss) | vs ru+sousy max=1000 |
| `/price-range?lang=ru&category=sousy` | `{ min:0, max:1000 }` | yes | Category applied, **no child recursion** | May differ from listing if subcategories exist |
| `/price-range?search=…` | Same as default | yes | **`search` ignored** (route does not pass it) | By design today |

---

## Current filters API behavior

### DB query pattern (`getFiltersUncached`)

1. Build `ProductWhereInput` inline (search + strict-locale category).
2. `db.product.findMany({ where, include: { variants (published), options, attributeValue, productAttributes → attribute → **all values** } })` — **no take/skip**.
3. Filter products by min/max price **in memory** (min published variant price).
4. Iterate variants/options → `colorMap` / `sizeMap`.
5. Second pass: `productAttributes` color enrichment.

### Relations loaded

| Relation | Loaded | Needed for facets only? |
|----------|--------|-------------------------|
| Product translations | No | No |
| Variants (published) | Yes | Yes (options source) |
| Variant options + attributeValue + translations | Yes | Yes |
| productAttributes → attribute → **all values** | Yes | Partial — enrichment only; loads **entire attribute value catalog** per product |

### Count semantics (code evidence)

```283:284:apps/web/lib/services/products-filters.service.ts
              colorMap.set(colorKey, {
                count: (existing?.count || 0) + 1,
```

```314:314:apps/web/lib/services/products-filters.service.ts
                sizeMap.set(normalizedSize, (sizeMap.get(normalizedSize) || 0) + 1);
```

| Question | Answer |
|----------|--------|
| Color count unit | **Per variant-option row** (each color option on each published variant increments +1) |
| Size count unit | **Per variant-option row** |
| Same color on multiple variants | **Yes — multiple increments** (e.g. red=2 from Products A and B) |
| productAttributes role | **Colors only** — can set `imageUrl`/`colors` hex; **does not increment count** unless variant option already counted |
| Can introduce count=0 colors? | **Yes** — if `productAttributes.attribute.values` entry has `imageUrl` or `colors` and key not in map (or existing count 0) |
| Sizes from productAttributes? | **No** |
| Unpublished variants | Excluded at query (`variants.where.published: true`) |
| Zero-count colors returned? | **Yes** — included in final array (observed: `green` count=0 with price filter) |
| Zero-count sizes returned? | **No** — sizes only from variant options with count ≥ 1 |

### Phase 5D verification

| Value | Expected | Actual | Match |
|-------|----------|--------|-------|
| red | 2 | 2 | yes |
| blue | 1 | 1 | yes |
| green | 1 | 1 | yes (scoped search, no price cap) |
| M | 1 | 1 | yes |
| L | 2 | 2 | yes |
| S | 1 | 1 | yes |

With `minPrice=1000&maxPrice=3000`: green count=0, S omitted — consistent with Product C (green/S @ 4000) excluded by price filter, green row retained via productAttributes enrichment path.

### Cache behavior after 5E1

- Public `getFilters` → `withRedisCache` → `getFiltersUncached`.
- Cache keys unchanged by rewrite if uncached function output identical.
- Warm: ~27–56 ms; cold miss (new key `minPrice=1001`): **~1834 ms** Run 1 → **29 ms** Run 2.

---

## Current price-range behavior

### DB query pattern (`getPriceRangeUncached`)

1. Inline `ProductWhereInput` + strict-locale category (single ID, **no children**).
2. `findMany` all products + published variants (price only).
3. JS global min/max across all variant prices.
4. Round: `floor(min/1000)*1000`, `ceil(max/1000)*1000`; empty → `{ min:0, max:100000 }`.
5. `adminService.getPriceFilterSettings()` for step sizes (unchanged).

### Price semantics

- Raw `variant.price`, published variants only.
- Published products: `product.published && deletedAt null`.
- **No discounts**.
- Category lookup: no `deletedAt`/`published` check on category; no locale fallback; no recursive children.

### Cache after 5E1

Same wrapper pattern as filters. Cold path still ~1.8s+ on cache miss.

---

## Shared where feasibility

| Question | Answer |
|----------|--------|
| Reuse `buildWhereClause` directly? | **Almost** — call with `{ lang, category, search, minPrice, maxPrice }` only; omit `colors`/`sizes`/`brand`/`filter`/`sort`/`page`/`limit` |
| Extract helper safely? | **Yes (recommended)** — e.g. `buildCatalogContextWhere(filters: FacetContextFilters)` extracting search + category + price from query-builder |
| Params filters API accepts today | `lang`, `category`, `search`, `minPrice`, `maxPrice` |
| Self-filtering risk (colors/sizes on facets route) | **None today** — route does not accept them; helper should not include unless route extended later |
| Brand on facets route | Not accepted — omit from shared where |
| Category locale fix | **Safe with sign-off** — use `findCategoryBySlug` + recursive children (filters already has private recursion; price-range does not) |
| Unknown category behavior | **Breaking if aligned to listing** — listing returns `where: null` → **total=0**; filters/price-range today **ignore** → full catalog |
| Price in DB vs in-memory for facets | Moving to `buildPriceFilter` in shared where **improves parity** with listing; may change facet sets vs current in-memory pass (likely correct) |

### Listing comparison (live)

| Request | Listing `meta.total` | Filters facets | Price-range max |
|---------|---------------------|----------------|-----------------|
| `lang=en&category=sousy` | 14 | Full test colors (bug) | 7000 (bug) |
| `lang=ru&category=sousy` | 14 | empty | 1000 |
| `lang=en&category=nonexistent` | **0** | full catalog (bug) | — |

**Parity target:** filters and price-range should match listing category resolution (`findCategoryBySlug`, recursive children, unknown → empty scope).

---

## Price-range aggregate feasibility

| Question | Answer |
|----------|--------|
| **Safe to implement?** | **Yes** — low–medium risk |
| Prisma aggregate | `db.productVariant.aggregate({ where: { published: true, product: productWhere }, _min: { price: true }, _max: { price: true } })` |
| Relation filter | `product` nested where works in Prisma |
| Price nullable? | **No** — `ProductVariant.price` is required `Float`; aggregate ignores nulls anyway |
| Published variants only? | **Yes** — match current |
| Published/non-deleted products? | Add to `productWhere`: `published: true, deletedAt: null` |
| Route params | Keep **only** `lang`, `category` (no search in 5E2 scope) |
| Recursive category children | Apply via shared where (currently missing in price-range) |
| Rounding | Keep existing JS floor/ceil after aggregate |
| stepSize logic | Unchanged — after aggregate |
| Empty result | `minPrice === Infinity` path → `{ min: 0, max: 100000 }` when no variants |
| Files to change | `products-filters.service.ts` (`getPriceRangeUncached`), new shared where module or import from query-builder |
| Response shape impact | **None** |
| Tests | en/ru category=sousy parity; unknown category; full catalog; empty catalog edge |

---

## Filters targeted facet feasibility

| Approach | Feasible | Risk | Preserves counts | Preserves labels | Preserves color enrichment | Notes |
|----------|----------|------|------------------|------------------|---------------------------|-------|
| **A — `ProductVariantOption.findMany`** | **Yes** | Medium | **Yes** (count rows in JS) | Yes (attributeValue translations + legacy value) | Separate query needed | **Recommended** |
| **B — Prisma `groupBy`** | Partial | Medium–High | Yes if groupBy option id/key | Harder for legacy flat `value` + translations | Separate query | Split queries for legacy vs new format |
| **C — Raw SQL** | Yes | High | Yes | Yes | Separate query | Overkill unless perf still insufficient |

### Recommended: Approach A

```typescript
// Pseudocode — do not implement in debug phase
const productWhere = await buildCatalogContextWhere({ lang, category, search, minPrice, maxPrice });

const options = await db.productVariantOption.findMany({
  where: {
    variant: {
      published: true,
      product: productWhere ?? { id: { in: [] } }, // empty if category unknown → listing parity
    },
    OR: [
      { attributeKey: { in: ["color", "size"] } },
      { attributeValue: { attribute: { key: { in: ["color", "size"] } } } },
    ],
  },
  include: {
    attributeValue: { include: { attribute: true, translations: true } },
  },
});
// JS: classify color vs size, increment maps, same label/count rules as today
```

- Smaller row set than full product graph (no productAttributes tree in main query).
- Must handle `productWhere === null` → return `{ colors: [], sizes: [] }` if aligning unknown category to listing.

---

## ProductAttributes enrichment

| Question | Answer |
|----------|--------|
| Current role | After variant scan, for each product with `productAttributes`, iterate **`attribute.values` (all values on attribute globally)**; if `imageUrl` or `colors` hex present, merge into `colorMap` with **count unchanged** |
| Must preserve? | **Yes for 5E2** — ColorFilter uses `imageUrl` and `colors[0]` for swatches; zero-count colors may appear |
| Minimal query | Second query: products matching `productWhere` with color `ProductAttribute` → join `AttributeValue` where `imageUrl != null OR colors != null` — **narrower than current** but may change zero-count edge cases |
| Risk if removed | UI swatches lose hex/image for colors without variant options in scope |
| Defer? | **No** — include as 5E2C sub-step with parity test for `maxPrice=3000` green count=0 case |

**Note:** Current enrichment loads all attribute values for any product linked to color attribute — inefficient and can add colors not tied to product variants. Rewriting should **preserve observable API output**, not necessarily replicate the over-broad include.

---

## Category parity

| Surface | Category resolution | Recursive children | Unknown slug |
|---------|--------------------|--------------------|--------------|
| **Listing** | `findCategoryBySlug` + locale fallback | Yes | **Empty result (total=0)** |
| **Filters** | Strict `locale` slug only | Yes (if found) | **Ignored → full catalog** |
| **Price-range** | Strict `locale` slug only | **No** | **Ignored → full catalog** |

| Mismatch (live) | Listing | Filters en+sousy | Filters ru+sousy | Price-range en | Price-range ru |
|-----------------|---------|------------------|------------------|----------------|----------------|
| category=sousy | total=14 | test facets (wrong) | empty | max=7000 (wrong) | max=1000 |

**Recommended fix:** shared `buildCatalogContextWhere` using `findCategoryBySlug` + `getAllChildCategoryIds`; unknown category → empty facets / `{ min:0, max:100000 }`.

**Include in:** Phase 5E2B (shared where + category parity) — **before or with** price-range aggregate so aggregate uses correct scope.

**Breaking change risk:** `nonexistent-slug` and `lang=en&category=sousy` responses **will change** — document in release notes; aligns with listing.

---

## Cache interaction (5E1 + future 5E2)

| Question | Answer |
|----------|--------|
| 5E1 cache remains valid? | **Yes** — rewrite inside `*Uncached` only |
| Cache keys need changes? | **No** — same context fields |
| Invalidation needs changes? | **No** — existing patterns sufficient |
| Cold path benefit after rewrite | **Yes** — cache miss drops from ~1.8s to estimated tens–low hundreds ms |
| HTTP Cache-Control | Keep unchanged |
| Test data cleanup | Run cleanup script + rely on `invalidateCatalogRedisCache` or TTL |

---

## Baseline measurements

Phase 5E1 cache active — use novel cache keys for cold estimate.

| Endpoint | Run 1 | Run 2 | Cold/warm | Notes |
|----------|-------|-------|-----------|-------|
| `/filters?search=Phase%205D%20Test` | 56 ms | 29 ms | warm | likely memory hit |
| `/filters?…&minPrice=1000&maxPrice=3000` | 27 ms | 27 ms | warm | cached from prior session |
| `/filters?…&minPrice=1001&maxPrice=3001` | **1834 ms** | 29 ms | **cold → warm** | proves uncached path still heavy |
| `/price-range?lang=en` | 27 ms | 27 ms | warm | |
| `/price-range?lang=ru&category=sousy` | 27 ms | 27 ms | warm | |

**Conclusion:** 5E1 masks repeat traffic; structural rewrite still required for cold misses, post-invalidation, and new filter contexts.

---

## Recommended implementation plan

### **Option A — Split into three subphases (recommended)**

Smallest safe increments; category parity isolated; facet rewrite last.

#### Phase 5E2A — Price-range aggregate only

| Item | Detail |
|------|--------|
| **Goal** | Replace `findMany` in `getPriceRangeUncached` with `productVariant.aggregate` |
| **Category** | Keep current strict-locale behavior **temporarily** to minimize diff — or include 5E2B first if parity preferred |
| **Files** | `products-filters.service.ts`, optionally extract `getPriceRangeUncached` helper |
| **Tests** | Default max=7000; ru+sousy max=1000; response shape; cache warm/cold |
| **Commit** | `perf(products): aggregate price range from variant prices` |
| **Risk** | **Low** |

#### Phase 5E2B — Shared catalog context where + category parity

| Item | Detail |
|------|--------|
| **Goal** | Extract `buildCatalogContextWhere({ lang, category, search, minPrice, maxPrice })` from query-builder; use in filters + price-range |
| **Fix** | `findCategoryBySlug`, recursive children, unknown category → empty |
| **Files** | `query-builder.ts` (export helper) or new `catalog-context-where.ts`, `products-filters.service.ts` |
| **Tests** | en/ru sousy parity with listing; nonexistent → empty facets / scoped price-range; **sign-off on behavior change** |
| **Commit** | `perf(products): align filters and price-range category context with listing` |
| **Risk** | **Medium** (intentional behavior fix) |

#### Phase 5E2C — Filters targeted facet query

| Item | Detail |
|------|--------|
| **Goal** | Replace `getFiltersUncached` product `findMany` with `ProductVariantOption.findMany` + productAttributes enrichment query |
| **Price** | Use DB `buildPriceFilter` via shared where (not in-memory) |
| **Files** | `products-filters.service.ts`, shared where module |
| **Tests** | Phase 5D golden counts; maxPrice green count=0; label locale; legacy + new option formats |
| **Commit** | `perf(products): replace filters catalog scan with targeted option query` |
| **Risk** | **Medium–High** |

**Why Option A over B/C/D:**

- **B** (5E2 aggregate + parity, 5E3 facets) bundles medium-risk facet work — acceptable but harder to bisect regressions.
- **C** (single 5E2) too large — category + aggregate + facets + enrichment in one PR.
- **D** (blocked) — not blocked; prerequisites met (test data, 5E1 cache, query-builder exists).

**Price-range before filters?** **Yes** — 5E2A is lowest risk and validates aggregate pattern; 5E2B should land before or with 5E2A if category-scoped price-range correctness matters more than minimal first diff.

---

## Stop conditions for implementation

Stop and request review if:

1. **Facet counts diverge** from Phase 5D golden table after 5E2C.
2. **`maxPrice=3000` green count=0** regression without approved enrichment strategy.
3. **Unknown category behavior** change (`nonexistent-slug`) not signed off — currently returns full catalog facets.
4. **`lang=en&category=sousy` parity fix** not signed off — will drop test-product facets from sousy context.
5. **Shared where** accidentally includes `colors`/`sizes`/`brand` from future route params without facet self-filter design.
6. **Price-range aggregate** returns different min/max after rounding for ru+sousy / full catalog baselines.
7. **productAttributes enrichment** removed or narrowed without ColorFilter swatch parity test.
8. **Cache keys or invalidation** modified unnecessarily — 5E2 should not require it.
9. **Prisma schema migration** required — not expected; stop if it becomes necessary.
10. **Attempt to add `search` to price-range route** — out of 5E2 scope unless explicitly approved as separate phase.

---

## Summary

| Item | Finding |
|------|---------|
| **Aggregate/shared where safe now?** | **Yes**, incrementally via Option A |
| **Split into subphases?** | **Yes** — 5E2A / 5E2B / 5E2C |
| **Price-range before filters?** | **Yes** — aggregate first (5E2A) |
| **Category locale parity fix safe?** | **Yes with sign-off** — intentional alignment with listing; breaking for en+sousy and unknown slug |
| **Facet counts preserved exactly?** | **Yes** with Approach A + enrichment parity tests; groupBy/SQL optional later |
| **5E1 cache** | Unchanged; rewrite in `*Uncached` only |
| **Risk level** | 5E2A Low · 5E2B Medium · 5E2C Medium–High |

**One-sentence recommendation:** Implement **Option A** — aggregate price-range first (5E2A), then shared listing-aligned catalog `where` with category parity (5E2B), then replace filters full scan with targeted `ProductVariantOption` queries plus preserved productAttributes color enrichment (5E2C).
