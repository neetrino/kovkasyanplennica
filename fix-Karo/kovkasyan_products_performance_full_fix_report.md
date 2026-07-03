# Kovkasyan Plennica / Products Performance Optimization — Full Fix Report

**Date:** 2026-07-02  
**Repository:** `neetrino/kovkasyanplennica`  
**Working branch:** `dev-Karo`  
**Main area:** public catalog / `/products` page / product APIs / product card hydration / bundle analysis  
**Workflow used:** `1 Phase = 1 Debug master prompt + 1 Implementation master prompt`

---

## 0. Executive summary

This document summarizes the full optimization and cleanup cycle that was performed around the product catalog, shop page, filters, product cards, and frontend bundle.

The work started with admin/listing cleanup and image optimization, then moved into the real catalog bottleneck: `/api/v1/products`, `/api/v1/products/filters`, `/api/v1/products/price-range`, and finally the `/products` page itself.

The optimization strategy was layered:

1. **Admin/product list cleanup**
2. **Frontend lazy loading and image optimization**
3. **Catalog API backend optimization**
4. **Filters and price-range API optimization**
5. **`/products` SSR/RSC payload reduction**
6. **Product card hydration reduction**
7. **Bundle analyzer / shared client shell audit**
8. **Final planned global shell optimization**

The biggest confirmed wins:

| Area | Before | After | Result |
|---|---:|---:|---:|
| `/products` SSR payload | ~301 KB | ~220 KB after Phase 7 | ~27% reduction |
| Serialized `defaultVariantId` count on `/products` | 35 | 9 | ~74% reduction |
| Product filters / price-range warm response | ~1–2s+ before cache/aggregate work | ~20–80ms warm | major improvement |
| Product listing warm API response | slow full/in-memory path | warm ~20–80ms after DB pagination/cache | major improvement |
| Global legacy `ProductCard` on `/products` | present | removed in Phase 8 | hydration structure improved |
| Cache tag mismatch for `/products` | present | fixed | safer invalidation |

The most important architectural change:

> The catalog was moved from “fetch too much, filter/sort/paginate in memory, serialize too much to the client, hydrate full cards” toward “DB-scoped queries, targeted API payloads, capped/lazy rows, and smaller client islands.”

---

## 1. Final workflow rule

During the work, the phase structure was adjusted because too many micro-phases were making the workflow unnecessarily heavy.

### Final agreed workflow

```txt
1 Phase = 1 Debug master prompt + 1 Implementation master prompt
```

### What this means

For each phase:

1. First create a **debug/audit master prompt**.
2. Cursor runs read-only inspection and produces a report.
3. Only after the debug report confirms the plan is safe, create **one combined implementation master prompt**.
4. The implementation prompt may include internal checkpoints.
5. The implementation phase should end with one commit and one push.
6. Avoid tiny subphases unless the debug report proves the risk is too high.

### Why this rule was created

At first, some tasks were split too much, for example into many small subphases. That was useful for high-risk DB/API changes, but became excessive for smaller work. The current rule keeps the safety of debug-first planning without turning development into a paperwork factory with Git commits wearing little hats.

---

## 2. Global safety rules used throughout the work

These rules were repeatedly included in Cursor prompts.

### Debug phase rules

Debug phases must:

- be read-only
- not modify production code
- not commit
- not push
- only create the allowed debug report file
- inspect current behavior before implementation

### Implementation phase rules

Implementation phases must:

- only touch approved files
- preserve existing API contracts unless explicitly approved
- preserve product/card behavior
- include stop conditions
- run API checks
- run browser smoke tests when needed
- run lint/build
- stage only intended files
- commit once
- push once

### Local files protected from commit

These local markdown/debug/test files were intentionally kept uncommitted:

```txt
PHASE_1_DEBUG_STATUS.md
PHASE_1A_DEBOUNCE_DEBUG.md
PHASE_1A_VERIFICATION.md
PHASE_1B_STOCK_FILTER_DEBUG.md
PHASE_4_PRODUCTS_CATALOG_DEBUG.md
PHASE_5D_COLOR_SIZE_FILTER_DEBUG.md
PHASE_5D_TEST_DATA_REPORT.md
PHASE_5E_FILTERS_API_DEBUG.md
PHASE_5E2_AGGREGATE_SHARED_WHERE_DEBUG.md
PHASE_6_PRODUCTS_PERFORMANCE_CLEANUP_DEBUG.md
PHASE_7_PRODUCTS_SSR_PAYLOAD_DEBUG.md
PHASE_8_SERVER_FIRST_PRODUCT_CARD_DEBUG.md
PHASE_9_BUNDLE_HYDRATION_ANALYSIS_DEBUG.md
PHASE_10_GLOBAL_CLIENT_SHELL_DEBUG.md
```

Protected local scripts:

```txt
scripts/phase5d-seed-color-size-test-data.cjs
scripts/phase5d-cleanup-color-size-test-data.cjs
```

These were not committed because they are local debugging/regression tools, not production code.

---

## 3. Phase timeline

| Phase | Commit / status | Main purpose |
|---|---|---|
| Phase 1 | `109af76` | Admin products list cleanup and server-side stock filter |
| Phase 2 | `6bb7738` | Lazy-load SpinWheelPopup |
| Phase 3 | `a6eccea` | Enable Next image optimization |
| Phase 4 | Debug only | Audit product listing/API bottlenecks |
| Phase 5A | `7b46777` | DB pagination for catalog listing |
| Phase 5B | `f16dee1` | Move price/brand filters to DB |
| Phase 5C | `40d6df0` | Lightweight listing query/transform |
| Phase 5D | `a444410` | Move color/size filters to DB |
| Phase 5E1 | `7271f61` | Cache filters and price-range APIs |
| Phase 5E2 | `68345bc` | Shared where, aggregate price-range, targeted facets |
| Phase 6 | `56b56ed` | `/products` safe cleanup and cache tag fix |
| Phase 7 | `c74c76d` | Reduce `/products` SSR payload with lazy rows |
| Phase 8 | `014168d` | Remove legacy ProductCard from `/products`, add catalog-specific islands |
| Phase 9 | Debug done / implementation planned | Bundle analyzer + wire existing server shell |
| Phase 10 | Debug planned | Global client shell/Header/Footer/Providers audit |

---

# PART A — EARLY CLEANUP PHASES

---

## 4. Phase 1 — Admin product list cleanup

### Problem

The admin products area had several inefficiencies:

- unnecessary debug loops
- repeated product list requests
- stock filter behavior not fully server-side
- search/SKU inputs triggering too many requests
- extra `$queryRaw SELECT 1` debug checks
- admin attributes logic doing unnecessary work

### Why it mattered

Admin performance matters because product management can become slow and annoying when every input change triggers heavy queries. Humans already invented admin panels, which was bold enough; they do not also need them to be slow.

### Fix

Commit:

```txt
109af76 fix(admin): complete phase 1 product list cleanup
```

Changed files included:

```txt
apps/web/app/(main)/admin/attributes/useAttributes.ts
apps/web/app/(main)/admin/products/components/ProductFilters.tsx
apps/web/app/(main)/admin/products/page.tsx
apps/web/app/api/v1/admin/products/route.ts
apps/web/lib/hooks/useDebouncedValue.ts
apps/web/lib/services/admin/admin-products-read/query-builder.ts
apps/web/lib/services/admin/admin-products-read/query-executor.ts
apps/web/lib/services/admin/admin-products-read/types.ts
```

### What was done

- removed admin attributes debug loop
- removed unnecessary `$queryRaw SELECT 1`
- added debounce for admin product search/SKU
- moved stock filter to server-side query logic
- cleaned query builder/executor types
- preserved admin list behavior

### Result

Admin list became cleaner and safer, with less pointless backend noise.

---

## 5. Phase 2 — Lazy-load SpinWheelPopup

### Problem

`SpinWheelPopup` was being loaded globally through client providers even when it was only needed on the home page.

### Why it mattered

A popup that is not visible should not punish every page. This is one of those rare truths that both humans and JavaScript should understand.

### Fix

Commit:

```txt
6bb7738 perf: lazy load spin wheel popup
```

Changed file:

```txt
apps/web/components/ClientProviders.tsx
```

### What was done

- dynamically imported `SpinWheelPopup`
- used `ssr: false`
- rendered it only on `/`
- preserved the existing business logic

### Result

Non-home routes stopped paying the JS cost for the spin wheel.

---

## 6. Phase 3 — Enable Next image optimization

### Problem

The project had global `images.unoptimized: true`, meaning Next image optimization was disabled broadly.

### Why it mattered

Product/shop pages rely heavily on images. Turning off image optimization globally is like buying a sports car and towing it everywhere with a donkey.

### Fix

Commit:

```txt
a6eccea perf: enable next image optimization
```

Changed areas:

```txt
next.config.js
ProductCard files
Home hero/carousel files
```

### What was done

- removed global `images.unoptimized: true`
- preserved remote patterns
- optimized key product/home images
- kept SVG and special cases unoptimized only where needed

### Result

The app could use Next image optimization normally instead of shipping images like it was 2009.

---

# PART B — CATALOG API OPTIMIZATION

---

## 7. Phase 4 — Product catalog debug audit

### Problem

Before changing product listing logic, the project needed a full audit of `/api/v1/products`.

### Main findings

The debug report found that product listing had several structural problems:

- DB fetch could use `skip: 0` and large raw `take`
- product pagination was partly in-memory
- some filters were DB-level, others were in-memory
- sorting was partly in-memory
- filters API scanned too much catalog data
- price range did full scans
- Redis cache existed, but cold paths were still expensive

### Important baseline observations

- `/api/v1/products` had Redis listing cache
- some safe paths could move to DB pagination
- `filters` and `price-range` needed separate optimization
- color/size semantics needed careful investigation

### Result

Phase 4 produced the roadmap for Phase 5:

```txt
5A — DB pagination
5B — price/brand DB filters
5C — lightweight listing query
5D — color/size DB filters
5E — filters/price-range optimization
```

---

## 8. Phase 5A — DB pagination

### Problem

Product listing was doing too much work after fetching data. Pagination could happen in the database for safe paths instead of fetching too much and slicing later.

### Fix

Commit:

```txt
7b46777 perf(products): paginate catalog queries in database
```

### What was done

- added DB pagination path with safe gate
- used real `skip/take` and count on safe paths
- kept legacy fallback for risky paths
- safe paths included:
  - default listing
  - category
  - DB search
  - `filter=new`
  - `filter=featured`

### What remained fallback

- price/brand until Phase 5B
- colors/sizes until Phase 5D
- price sort
- bestseller
- Meili search paths

### Result

Listing became safer and faster for core product listing paths without breaking risky filters.

---

## 9. Phase 5B — Price and brand filters moved to DB

### Problem

Price and brand filters were still preventing DB pagination and forcing heavier filtering behavior.

### Fix

Commit:

```txt
f16dee1 perf(products): move price and brand filters to database
```

Changed file:

```txt
apps/web/lib/services/products-find-query/query-builder.ts
```

### What was done

- moved `minPrice`, `maxPrice`, and brand filters into Prisma where
- allowed DB pagination when price/brand filters are active
- preserved published variant semantics

### Important price semantics

The price logic used raw `ProductVariant.price` and only published variants.

- `minPrice`: no published variant below min
- `maxPrice`: at least one published variant <= max
- brand: by `product.brandId`

### Result

Price/brand filtered listing became DB-scoped instead of in-memory scoped.

---

## 10. Phase 5C — Lightweight listing query

### Problem

Even with DB pagination, the listing query was selecting too much product data.

### Fix

Commit:

```txt
40d6df0 perf(products): use lightweight catalog listing query
```

Created/changed files:

```txt
apps/web/lib/services/products-find-query/listing-select.ts
apps/web/lib/services/products-find-query/listing-query-executor.ts
apps/web/lib/services/products-find-listing-transform.service.ts
apps/web/lib/services/products-find-query.service.ts
apps/web/lib/services/products-find.service.ts
```

### What was done

- created a lightweight select for listing paths
- created slim listing transformer
- kept legacy full transformer as fallback
- removed heavy unused fields from the DB pagination path
- preserved public ProductCard response shape

### API keys after optimization

The listing path still returned the expected ProductCard fields:

```txt
brand
categories
colors
compareAtPrice
defaultVariantId
description
discountPercent
id
image
inStock
labels
originalPrice
price
slug
stock
title
```

### Known note

A previous contract check mentioned `category` missing, but `categories[]` existed. Later `/products` page derived a `category` string from `categories[0].title`, so no API-level `category` field was needed.

### Result

The product listing query became much lighter without changing the frontend response contract.

---

## 11. Phase 5D — Color and size filters moved to DB

### Problem

Color and size filters were still in-memory and had tricky semantics.

### Debug findings

Color/size filters needed to preserve:

- multi-color OR
- multi-size OR
- color and size combined as AND
- combined color+size must match the same variant
- only published variants
- normalized color display strings
- normalized size display strings
- new and legacy variant option formats

### Test data setup

Because the dev DB did not have enough real color/size data, safe test products were created locally.

Test structure:

| Product | Variants |
|---|---|
| Product A | red/M, blue/L |
| Product B | red/L |
| Product C | green/S |

Golden rules:

- `colors=red,green&sizes=L` should return Product B only
- Product A has red/M and blue/L, but no red/L, so it should not match same-variant red+L

### Fix

Commit:

```txt
a444410 perf(products): move color and size filters to database
```

Changed file:

```txt
apps/web/lib/services/products-find-query/query-builder.ts
```

### What was done

- implemented color/size DB `where`
- preserved same-variant semantics
- preserved `published: true`
- kept legacy fallback
- allowed DB pagination with colors/sizes
- normalized placeholders like `null` and `undefined`

### Result

Color and size filters became DB-scoped and golden vectors passed.

---

## 12. Phase 5E1 — Cache filters and price-range APIs

### Problem

Even after listing improvements, `/api/v1/products/filters` and `/api/v1/products/price-range` had poor cold/warm behavior and lacked consistent caching.

### Fix

Commit:

```txt
7271f61 perf(products): cache filters and price range APIs
```

Changed files:

```txt
apps/web/lib/cache/redis-keys.ts
apps/web/lib/cache/redis-invalidate.ts
apps/web/lib/services/products-filters.service.ts
apps/web/app/api/v1/products/filters/route.ts
apps/web/app/api/v1/products/price-range/route.ts
```

### What was done

- added Redis cache keys for filters and price range
- wrapped `getFilters` and `getPriceRange` with Redis cache
- added invalidation patterns:
  - `shop:filters:*`
  - `shop:price-range:*`
- added HTTP cache headers:
  - `public, s-maxage=3600, stale-while-revalidate=3600`

### Key cache behavior

- filters key included:
  - `lang`
  - `category`
  - `search`
  - `minPrice`
  - `maxPrice`
- filters key excluded:
  - colors
  - sizes
  - brand
  - page
  - limit
  - sort
- price-range key included:
  - `lang`
  - `category`

### Result

Warm filters/price-range requests became very fast, around tens of milliseconds.

---

## 13. Phase 5E2 — Remove full scans from filters/price-range

### Problem

Caching helped warm responses, but cold uncached logic still used heavy catalog scans.

### Debug findings

The audit found:

- filters API had full unbounded product graph scan
- price-range had full product/variant scan in JS
- category behavior was inconsistent with listing:
  - unknown categories returned full catalog in filters/price-range
  - listing returned zero
- filters count semantics had to be preserved

### Fix

Commit:

```txt
68345bc perf(products): replace filter scans with shared catalog queries
```

Changed production files:

```txt
apps/web/lib/services/products-filters.service.ts
apps/web/lib/services/products-find-query/catalog-context-where.ts
```

### What was done

- created shared catalog context where
- aligned category behavior with listing:
  - locale fallback
  - recursive child categories
  - unknown category => empty
- replaced price-range JS scan with `productVariant.aggregate`
- replaced filters full product scan with targeted `ProductVariantOption` query
- preserved `productAttributes` color enrichment
- preserved response shape
- preserved cache wrappers and keys

### Intentional behavior changes

| Case | Before | After |
|---|---|---|
| `filters?lang=en&category=sousy` | unrelated test facets | empty scoped facets |
| `price-range?lang=en&category=sousy` | full catalog range | scoped range |
| unknown category filters | full catalog facets | empty facets |
| unknown category price-range | full catalog range | empty fallback |

### Result

Filters and price-range became targeted and listing-aligned.

---

# PART C — `/products` PAGE PERFORMANCE

---

## 14. Phase 6 — Products page safe cleanup

### Problem

After backend/API improvements, `/products` still had:

- large SSR/RSC payload
- client hydration cost
- cache tag mismatch
- raw decorative images
- over-serialized client props

### Debug findings

Phase 6 audit showed:

- `/products` fetched `limit=120`
- category-row pagination sliced rows, not products
- product cards were hydrated client-side
- filters/BrandFilter were orphan and not mounted
- ProductCard API did not need top-level `category`
- page cache used `products-list` tag
- admin invalidator used only `products`

### Fix

Commit:

```txt
56b56ed perf(products): trim shop page payload and cache tags
```

Changed files:

```txt
apps/web/app/(main)/products/page.tsx
apps/web/components/ProductsCategoryCarousel.tsx
apps/web/components/products/catalog-card-product.ts
apps/web/components/ProductsMobileCategoriesDrawerLazy.tsx
apps/web/lib/services/admin/admin-products-update/cache-revalidator.ts
```

### What was done

- added `revalidateTag('products-list')`
- introduced `CatalogCardProduct`
- mapped API products to slim client props
- removed `categories[]`, `colors`, `labels` from client boundary
- lazy-loaded mobile categories drawer
- added lazy/async behavior to decorative images
- did not mount orphan filters
- did not touch API/Prisma/query logic

### Result

Correctness improved and cache invalidation became safer, but payload size did not materially improve.

Observed:

```txt
/products before: ~291 KB
/products after: ~301 KB
```

This was not a real performance win. It was still useful cleanup, but not enough.

---

## 15. Phase 7 — Real `/products` SSR payload reduction

### Problem

Phase 6 trimmed fields but not product volume. The page still serialized too many products into the RSC payload.

### Debug findings

Phase 7 found:

- default `/products` fetched 94 products
- 18 category rows existed
- page 1 rendered 6 category rows
- 35 products were serialized to client
- only around 12–16 were initially visible
- hidden products inside collapsed carousels were still serialized
- below-fold rows hydrated immediately
- category-filtered page was much smaller, proving payload scaled with serialized products

### Fix

Commit:

```txt
c74c76d perf(products): reduce shop SSR payload with lazy rows
```

Changed files:

```txt
apps/web/app/(main)/products/page.tsx
apps/web/components/ProductsCategoryCarousel.tsx
apps/web/components/products/catalog-card-product.ts
apps/web/components/products/LazyCategoryProductsSection.tsx
apps/web/components/products/fetch-category-row-products.ts
apps/web/components/products/shop-listing-limits.ts
```

### What was done

- capped initial SSR products per row to 4
- rendered above-fold rows first
- lazy-loaded below-fold category rows
- added expand fetch for full category row
- kept unfiltered limit 120 to avoid hiding catalog categories
- added filtered fetch cap of 50
- trimmed card props further:
  - `brandName` instead of full brand object
  - omitted empty descriptions
  - dropped redundant `originalPrice`
- preserved add-to-cart fields

### Before/after

| URL | Before | After | Result |
|---|---:|---:|---:|
| `/products` | 301,044 B | 220,464 B | -27% |
| `/products?category=sousy` | 176,315 B | 172,980 B | -2% |
| `/products?page=2` | 279,379 B | 243,780 B | -13% |
| `/products?sort=price-asc` | 306,974 B | 246,670 B | -20% |
| `/products?sort=name-asc` | 309,515 B | 246,629 B | -20% |

### Payload signals

| Signal | Before | After | Result |
|---|---:|---:|---:|
| `defaultVariantId` count | 35 | 9 | -74% |
| `self.__next_f.push` count | 30 | 25 | -5 chunks |

### Result

This was the first big `/products` page-level payload win.

---

# PART D — PRODUCTCARD HYDRATION

---

## 16. Phase 8 — Remove global ProductCard from `/products`

### Problem

After Phase 7, payload was much better, but visible product cards still hydrated the global full `ProductCard` tree.

Global `ProductCard` pulled:

- `useAddToCart`
- `useCurrency`
- `useTranslation`
- `usePrefetchOnHover`
- image error state
- layout components
- card info components

### Debug findings

Phase 8 debug showed:

- `ProductCard` was used across many surfaces:
  - `/products`
  - home menu/favorites
  - PDP related products
  - mobile home
  - legacy grids
- global refactor would be risky
- `/products` could use a separate catalog-specific card
- wishlist/compare were not used on `/products`
- add-to-cart and currency could become small islands
- current client carousel could not directly import a server card
- server-first card required row split

### Fix

Commit:

```txt
014168d perf(products): server-first catalog cards with client islands
```

Changed files:

```txt
apps/web/app/(main)/products/page.tsx
apps/web/components/ProductsCategoryCarousel.tsx
apps/web/components/products/catalog-card-product.ts
apps/web/components/products/catalog-card-layout.ts
apps/web/components/products/CatalogProductCardShell.tsx
apps/web/components/products/CatalogProductCardClient.tsx
apps/web/components/products/ProductCardCatalogIslands.tsx
apps/web/components/products/ProductsCategoryRow.tsx
apps/web/components/products/ProductsCategoryExpandControls.tsx
apps/web/components/products/LazyCategoryProductsSection.tsx
```

### What was done

- created catalog-specific card structure
- added `CatalogProductCardShell.tsx`
- added `CatalogProductCardClient.tsx`
- added `ProductCardCatalogIslands.tsx`
- split category row logic:
  - `ProductsCategoryRow`
  - `ProductsCategoryExpandControls`
- removed global `ProductCard` from `/products`
- kept home/PDP/mobile cards unchanged
- did not touch API/Prisma/cache

### Important implementation note

`CatalogProductCardShell` was created and ready for future SSR wiring, but the implementation found that wiring it immediately doubled serialized props and increased HTML to around 262 KB.

So the safe decision was:

- use `CatalogProductCardClient` for current `/products` cards
- keep payload near Phase 7 baseline
- leave `CatalogProductCardShell` in codebase for Phase 9 wiring

### Before/after

| URL | Before | After |
|---|---:|---:|
| `/products` | 220,464 B | 223,012 B |
| `/products?category=sousy` | 171,585 B | 172,900 B |
| `/products?page=2` | 243,780 B | 246,953 B |
| `/products?sort=price-asc` | 246,670 B | 249,880 B |

### Hydration structure

Before:

```txt
ProductCard
  ProductCardGrid
  ProductCardInfo
  ProductCardLink
  usePrefetchOnHover
  useCurrency
  useAddToCart
```

After:

```txt
CatalogProductCardClient
  ProductCardCatalogIslands
    useCurrency
    useAddToCart
```

### Result

The global `ProductCard` was removed from `/products`, reducing the route-specific client card complexity without touching other surfaces.

---

## 17. Phase 9 — Bundle/hydration debug

### Problem

After Phase 8, `/products` no longer used global `ProductCard`, but the card was still not truly server-first.

### Debug findings

Phase 9 found:

- Phase 8 pushed successfully
- `CatalogProductCardShell.tsx` exists
- `CatalogProductCardShell` is unused
- `ProductsCategoryExpandControls` already supports `children`
- `ProductsCategoryRow` does not pass shell children
- `/products` uses `CatalogProductCardClient` for all visible cards
- analyzer was not installed
- manual chunk search is not enough
- largest shared baseline is still significant

### Build/chunk findings

Important chunk findings included:

| Chunk / group | Size | Notes |
|---|---:|---|
| largest static JS chunk | ~310 KB | framework/vendor-like |
| shared root baseline | ~569 KB | global shared cost |
| route-adjacent products chunk | ~34 KB | expand controls, cart/currency, visible cards |
| legacy ProductCard chunks | still exist | used by home/PDP/mobile, not initial `/products` |

### Recommended implementation

Phase 9 recommendation:

1. add `@next/bundle-analyzer`
2. add `ANALYZE=true` support
3. add `build:analyze` script
4. capture analyzer baseline
5. wire `CatalogProductCardShell` into `ProductsCategoryRow`
6. pass shell cards as children to `ProductsCategoryExpandControls`
7. keep `CatalogProductCardClient` for fetched/expanded/lazy paths

### Status

Phase 9 debug is complete. Implementation prompt was prepared, but final implementation report has not been provided in the conversation at the time of this document.

### Result so far

Phase 9 is the measurement and final wiring phase for `/products` card hydration.

---

# PART E — GLOBAL SHELL / FINAL PERFORMANCE PHASE

---

## 18. Phase 10 — Planned global client shell audit

### Why Phase 10 exists

After product APIs, `/products` SSR payload, and card hydration were optimized, the remaining likely cost is the global shell:

- `ClientProviders`
- `MainSiteChrome`
- `Header`
- `Footer`
- auth/cart/wishlist/compare providers
- toast
- route prefetch
- mobile menu
- search overlay
- currency/language UI

Phase 9 debug showed a large shared root baseline of around 569 KB, meaning not all remaining cost is inside the product page itself.

### Planned debug report

Phase 10 debug file:

```txt
PHASE_10_GLOBAL_CLIENT_SHELL_DEBUG.md
```

### What it should audit

- global client components
- Header client boundaries
- Footer client boundaries
- Footer hydration warning
- global providers
- cart/wishlist/compare leakage
- mobile menu/search overlay loading
- toast loading
- shared chunks across routes
- whether any provider can move closer to the route that needs it

### Possible implementation options

| Option | Purpose | Risk |
|---|---|---|
| Footer server conversion | Fix hydration warning and reduce client JS | low |
| Header server shell + islands | Reduce global header JS | medium |
| ClientProviders split | Reduce provider JS on all routes | medium |
| Lazy search/mobile overlays | Reduce first-load JS | low-medium |
| Stop and final QA | If further work is too risky | safest |

### Recommended stance

Phase 10 should probably be the last planned performance phase.

Phase 11 should only happen if Phase 10 debug finds a large, measurable, safe bottleneck.

---

# PART F — FIXES BY PROBLEM AREA

---

## 19. Problem: Product APIs were doing too much in memory

### Symptoms

- high cold response times
- full catalog fetches
- in-memory sorting/filtering
- pagination after fetching too many products

### Root cause

The API was built around flexible product transforms, but too many paths used broad product graphs and in-memory logic.

### Fixes

- Phase 5A: DB pagination
- Phase 5B: DB price/brand filters
- Phase 5C: lightweight listing select
- Phase 5D: DB color/size filters
- Phase 5E2: shared where and targeted queries

### Final state

Product listing is DB-scoped for core paths and uses lighter transforms.

---

## 20. Problem: Filters and price range were expensive

### Symptoms

- filters API slow
- price-range API slow
- full catalog scans
- inconsistent category behavior

### Root cause

Filters and price range were scanning product/variant data instead of using targeted DB queries.

### Fixes

- Phase 5E1 added Redis + HTTP cache
- Phase 5E2 replaced scans:
  - price-range via `productVariant.aggregate`
  - filters via targeted `ProductVariantOption` query
  - shared listing-aligned category where

### Final state

Filters and price range are fast and category-aligned.

---

## 21. Problem: Category parity mismatch

### Symptoms

- listing showed zero for unknown category
- filters returned full catalog for unknown category
- price-range returned full catalog for unknown category
- English category slug sometimes did not scope correctly

### Root cause

Filters/price-range category resolution was not aligned with listing category utils.

### Fix

Phase 5E2 introduced shared catalog context where using listing category resolution.

### Final state

Unknown category now returns empty scope consistently.

---

## 22. Problem: `/products` shipped too much RSC payload

### Symptoms

- `/products` HTML/RSC around 300 KB
- too many products serialized
- hidden carousel products still sent to browser
- below-fold rows hydrated immediately

### Root cause

The page fetched full first batch, grouped all rows, and sent all products from visible category rows even if most were collapsed or below-fold.

### Fixes

- Phase 6 slimmed props but did not reduce product count
- Phase 7 capped initial row products
- Phase 7 lazy-loaded below-fold rows
- Phase 7 fetched remaining category products only on expand
- Phase 7 added filtered fetch cap

### Final state

`/products` shrank by around 27%.

---

## 23. Problem: ProductCard was too client-heavy

### Symptoms

Every visible card on `/products` hydrated the global `ProductCard` tree.

### Root cause

The global card component had browser-only hooks at top-level:

- cart hook
- currency hook
- hover prefetch hook
- image error state

### Fix

Phase 8 introduced catalog-specific card components and removed global `ProductCard` from `/products`.

### Final state

`/products` uses catalog-specific components and smaller islands, while home/PDP/mobile still use the existing global card.

---

## 24. Problem: Server-first card shell existed but was unused

### Symptoms

Phase 8 created `CatalogProductCardShell.tsx`, but Phase 9 debug found it had zero imports outside itself.

### Root cause

During Phase 8, wiring the server shell caused HTML growth due to duplicated props, so safe client catalog card path was chosen.

### Planned fix

Phase 9 implementation should wire server shell properly using server children support already present in `ProductsCategoryExpandControls`.

### Expected final path

```txt
ProductsCategoryRow (server)
  ProductsCategoryExpandControls (client)
    children: CatalogProductCardShell (server cards)
    expanded/fetched fallback: CatalogProductCardClient
```

---

## 25. Problem: Global shared JS baseline remains large

### Symptoms

Phase 9 debug found a shared root baseline around 569 KB.

### Root cause

Likely global client shell and providers:

- `ClientProviders`
- Header/Footer
- global cart/auth/currency/toast/prefetch logic
- mobile/search overlays
- shared chunks

### Planned fix

Phase 10 debug should identify the safest global reduction.

Possible candidates:

- Footer server conversion
- Header server shell
- lazy search/mobile overlay
- split non-critical providers
- reduce provider scope

---

# PART G — KNOWN ISSUES / NOT FIXED YET

---

## 26. Known issue: Footer hydration warning

### Status

A pre-existing Footer hydration warning was observed.

### Not introduced by

Phase 7 or Phase 8, according to the reports.

### Why it matters

Hydration warnings can hide real bugs and create inconsistent UI. They are also emotionally annoying, which is not a technical metric, but somehow still true.

### Suggested handling

Phase 10 should audit Footer:

- is it client?
- does it use dynamic data?
- does it use `Date`, `Math.random`, browser-only values, or translated values inconsistently?
- can Footer become server component?
- can interactive parts be isolated?

---

## 27. Known issue: Prisma EPERM on Windows

### Status

Build sometimes reports Prisma EPERM because the dev server locks the query engine.

### Example

```txt
query_engine-windows.dll.node locked by dev server
```

### Impact

Usually non-blocking if Next compile succeeds using existing Prisma client.

### Suggested handling

- stop dev server before `prisma generate` when needed
- treat as non-blocking if build succeeds
- report clearly in final reports

---

## 28. Known issue: Pre-existing admin TypeScript/lint error

### Status

Phase 9 debug mentioned a full typecheck/admin TS error in:

```txt
useProductFormHandlers.ts:376
```

Another report mentioned full workspace lint issue related to admin/ErrorState-like files.

### Impact

Not caused by product performance phases, but can block full builds/analyzer output if not handled.

### Suggested handling

Do not mix this into performance phases unless it blocks measurement. If needed, create a separate small debug/implementation phase or final cleanup task.

---

## 29. Known issue: Phase 5D test scripts remain local

### Status

The seed/cleanup scripts remain uncommitted.

### Why

They were used for DB regression testing of color/size filters.

### Current DB state

Reports indicated Phase 5D test data is no longer present in dev DB.

### Suggested handling

Keep scripts uncommitted unless the team decides to preserve them as official regression utilities.

---

## 30. Known issue: Full server-first ProductCard not global

### Status

Global ProductCard still exists and is used by:

- home menu/favorites
- PDP related
- mobile home
- legacy grids

### Why not changed

Global refactor would have high blast radius.

### Suggested handling

Only consider global server-first ProductCard after Phase 10/final QA if analyzer proves a major benefit.

---

# PART H — FILES AND COMMITS

---

## 31. Important commits

```txt
109af76 fix(admin): complete phase 1 product list cleanup
6bb7738 perf: lazy load spin wheel popup
a6eccea perf: enable next image optimization
7b46777 perf(products): paginate catalog queries in database
f16dee1 perf(products): move price and brand filters to database
40d6df0 perf(products): use lightweight catalog listing query
a444410 perf(products): move color and size filters to database
7271f61 perf(products): cache filters and price range APIs
68345bc perf(products): replace filter scans with shared catalog queries
56b56ed perf(products): trim shop page payload and cache tags
c74c76d perf(products): reduce shop SSR payload with lazy rows
014168d perf(products): server-first catalog cards with client islands
```

---

## 32. Important files by layer

### Admin products

```txt
apps/web/app/(main)/admin/products/page.tsx
apps/web/app/(main)/admin/products/components/ProductFilters.tsx
apps/web/app/api/v1/admin/products/route.ts
apps/web/lib/services/admin/admin-products-read/query-builder.ts
apps/web/lib/services/admin/admin-products-read/query-executor.ts
apps/web/lib/services/admin/admin-products-read/types.ts
```

### Product listing APIs

```txt
apps/web/lib/services/products-find.service.ts
apps/web/lib/services/products-find-query.service.ts
apps/web/lib/services/products-find-query/query-builder.ts
apps/web/lib/services/products-find-query/listing-select.ts
apps/web/lib/services/products-find-query/listing-query-executor.ts
apps/web/lib/services/products-find-listing-transform.service.ts
apps/web/lib/services/products-find-query/catalog-context-where.ts
```

### Filters / price range

```txt
apps/web/lib/services/products-filters.service.ts
apps/web/app/api/v1/products/filters/route.ts
apps/web/app/api/v1/products/price-range/route.ts
apps/web/lib/cache/redis-keys.ts
apps/web/lib/cache/redis-invalidate.ts
```

### Products page

```txt
apps/web/app/(main)/products/page.tsx
apps/web/components/ProductsCategoryCarousel.tsx
apps/web/components/ProductsMobileCategoriesDrawerLazy.tsx
apps/web/components/products/catalog-card-product.ts
apps/web/components/products/shop-listing-limits.ts
apps/web/components/products/LazyCategoryProductsSection.tsx
apps/web/components/products/fetch-category-row-products.ts
```

### Catalog-specific product card components

```txt
apps/web/components/products/catalog-card-layout.ts
apps/web/components/products/CatalogProductCardShell.tsx
apps/web/components/products/CatalogProductCardClient.tsx
apps/web/components/products/ProductCardCatalogIslands.tsx
apps/web/components/products/ProductsCategoryRow.tsx
apps/web/components/products/ProductsCategoryExpandControls.tsx
```

### Global shell candidates for Phase 10

```txt
apps/web/components/ClientProviders.tsx
apps/web/components/MainSiteChrome.tsx
apps/web/components/Header.tsx
apps/web/components/Footer.tsx
```

---

# PART I — MEASUREMENT SUMMARY

---

## 33. API improvements

### Product listing

Before:

- large fetches
- in-memory filtering/pagination
- heavy transforms

After:

- DB pagination
- DB filters for price/brand/color/size
- lightweight select
- Redis/HTTP cache

### Filters / price-range

Before:

- full catalog scans
- JS aggregation
- category mismatch

After:

- targeted facet query
- aggregate price range
- shared catalog where
- cache

---

## 34. `/products` payload improvements

### Phase 6

Safe cleanup but no meaningful size win.

```txt
~292 KB → ~301 KB
```

### Phase 7

Major real win.

```txt
301,044 B → 220,464 B
```

### Phase 8

Small acceptable regression for hydration structure improvement.

```txt
220,464 B → 223,012 B
```

---

## 35. Hydration direction

Before Phase 8:

```txt
/products initial cards used global ProductCard
```

After Phase 8:

```txt
/products initial cards use CatalogProductCardClient + ProductCardCatalogIslands
global ProductCard removed from /products path
```

Planned Phase 9:

```txt
/products initial cards should use CatalogProductCardShell server children
expanded/lazy fetched products can use CatalogProductCardClient
```

---

# PART J — FINAL RECOMMENDATIONS

---

## 36. What should happen next

### Step 1 — Finish Phase 9 implementation

Goal:

- add bundle analyzer
- capture baseline
- wire `CatalogProductCardShell`
- verify analyzer after
- keep Phase 7 payload win
- do not touch global ProductCard

Expected commit:

```txt
perf(products): add bundle analyzer and wire catalog server shells
```

### Step 2 — Run Phase 10 Debug

Goal:

- inspect global client shell
- identify Header/Footer/Providers/shared chunk issues
- decide if one final implementation is safe

### Step 3 — Phase 10 Implementation or stop

If Phase 10 finds a safe measurable target, implement it.

If not, stop performance work and move to final QA.

---

## 37. What should not be done casually

Do not casually:

- refactor global ProductCard
- rewrite Header/Footer design
- move providers without understanding cart/auth behavior
- change API contracts
- change Prisma schema
- delete debug scripts
- reduce product listing limit globally below current catalog coverage
- mount BrandFilter/facet UI without product decision
- start Phase 11 just because the number 11 exists and humanity enjoys suffering

---

## 38. Final QA checklist

After Phase 10 or after deciding to stop, run a final QA pass.

### Build and code checks

```txt
npm run lint --workspace=@shop/web
npm run build --workspace=@shop/web
```

### Core pages

```txt
/
 /products
 /products?category=sousy
 /products?page=2
 /products?sort=price-asc
 /products?sort=name-asc
 /products/matsun-sousy
 /cart
 /wishlist
 /compare
```

### Manual behavior checks

- product cards render
- images render
- add-to-cart works
- cart updates
- currency switch works
- expand category row works
- lazy below-fold rows load
- sort works
- mobile drawer works
- PDP works
- home product sections still work
- Footer hydration warning is either fixed or documented
- no new console errors

### Deployment

- push to `origin/dev-Karo`
- verify Vercel deployment
- verify production route sizes if possible
- check real browser DevTools network
- check mobile performance

---

## 39. Final project state summary

The project moved from a catalog flow that relied heavily on broad product data and client-heavy rendering to a layered optimized flow:

```txt
DB scoped queries
  → lightweight listing response
  → cached facets and price-range
  → scoped /products SSR payload
  → capped/lazy category rows
  → catalog-specific card components
  → planned bundle analyzer and global shell cleanup
```

The biggest confirmed practical improvement is the `/products` payload reduction from around 301 KB to around 220 KB, plus the removal of global `ProductCard` from `/products`.

At this point, further improvements should be driven by bundle analyzer evidence, not guesswork. Guesswork is how people invent bugs with confidence, and we have already donated enough time to that charity.

---

# Appendix A — Phase-by-phase short version

| Phase | Problem | Fix | Status |
|---|---|---|---|
| 1 | Admin list noisy/slow | debounce, server stock filter, remove debug queries | Done |
| 2 | SpinWheel loaded globally | lazy-load only on home | Done |
| 3 | Images globally unoptimized | enable Next image optimization | Done |
| 4 | Unknown catalog bottlenecks | full audit | Done |
| 5A | In-memory pagination | DB pagination | Done |
| 5B | Price/brand in memory | DB filters | Done |
| 5C | Heavy listing select | lightweight select/transform | Done |
| 5D | Color/size in memory | DB filters, same-variant logic | Done |
| 5E1 | Filters/price-range uncached | Redis + HTTP cache | Done |
| 5E2 | Filters/price scans | aggregate/targeted queries | Done |
| 6 | `/products` safe cleanup | cache tag + slim props | Done |
| 7 | `/products` payload too large | cap rows + lazy rows + expand fetch | Done |
| 8 | Global ProductCard on shop | catalog-specific card/islands | Done |
| 9 | No analyzer / shell unused | analyzer + wire server shell | Debug done / implementation planned |
| 10 | Global shared JS cost | global shell audit | Planned |

---

# Appendix B — One-sentence history

The project started by cleaning admin/listing noise, then moved filtering/pagination into the database, then cached and targeted facets, then cut `/products` RSC payload by sending fewer products, then removed the global `ProductCard` from the shop route, and now needs analyzer-driven cleanup of product card shell wiring and global layout JavaScript.

