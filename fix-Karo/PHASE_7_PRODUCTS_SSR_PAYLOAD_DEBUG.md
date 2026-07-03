# Phase 7 Products SSR Payload Debug

**Date:** 2026-07-02  
**Branch:** `dev-Karo`  
**Phase type:** DEBUG / AUDIT ONLY — no production code changes  
**Scope:** Why `/products` still ships a large SSR/RSC/client payload after Phase 6; server-first card feasibility; combined Phase 7 implementation plan

---

## Git state

| Item | Value |
|------|-------|
| **Branch** | `dev-Karo` |
| **Tracking** | Up to date with `origin/dev-Karo` |
| **Latest commits** | `56b56ed` perf(products): trim shop page payload and cache tags · `68345bc` perf(products): replace filter scans with shared catalog queries · `7271f61` perf(products): cache filters and price range APIs |
| **Local debug/test files** | Pre-existing untracked debug markdown + Phase 5D scripts; modified `PHASE_1_DEBUG_STATUS.md` |
| **Production code changed** | **no** |

---

## Prior reports confirmed

| Finding | Still true after Phase 6 |
|---------|--------------------------|
| Phase 6 was safe cleanup, not major payload reduction | **Yes** — slim `CatalogCardProduct`, cache tag fix, lazy mobile drawer; product count and client card boundary unchanged |
| `/products` SSR payload ~292 KB before Phase 6, no meaningful improvement | **Yes** — baseline now **~301 KB** (within measurement variance; not a meaningful win) |
| Product APIs warm-fast after Phase 5 | **Yes** — listing/filters/price-range warm ~20–80 ms |
| Orphan filters and BrandFilter not mounted | **Yes** |
| Remaining bottleneck is `/products` SSR/client payload/hydration | **Yes** — confirmed as root cause |

---

## Baseline measurements

**Environment:** Local dev, `http://localhost:3000`, catalog **94** published products (`meta.total`), **18** category rows when all products fetched.

| URL | Run 1 | Run 2 | Size (RawContentLength) | Cache-Control | Notes |
|-----|-------|-------|-------------------------|---------------|-------|
| `/products` | 566 ms | 451 ms | **301,044 B** | `no-cache, must-revalidate` | Default shop; 6 category rows page 1 |
| `/products?category=sousy` | 331 ms | 360 ms | **176,315 B** | `no-cache, must-revalidate` | 14 products, 1 category row — **42% smaller** |
| `/products?page=2` | 431 ms | 431 ms | **279,379 B** | `no-cache, must-revalidate` | Still fetches all 94 products server-side; renders rows 7–12 |
| `/products?sort=price-asc` | 449 ms | 455 ms | **306,974 B** | `no-cache, must-revalidate` | Client re-sort; slightly larger than default |
| `/products?sort=name-asc` | 3,472 ms* | 464 ms | **309,515 B** | `no-cache, must-revalidate` | *Run 1 cold/compile noise |

**HTML content length (body):** 293,718 chars  
**Approx RSC inline script payload:** ~78,849 chars across 30 `self.__next_f.push` chunks  
**Serialized product signals in default page HTML:** 35× `defaultVariantId`, 35× `brand`, 36× `description`  
**Category row headers on page 1:** 6 (`category-row-0` … `category-row-5`)

### Phase 6 vs current size

| Metric | Phase 6 report (pre-push baseline) | Current (post Phase 6) | Delta |
|--------|-------------------------------------|------------------------|-------|
| `/products` RawContentLength | 292,863 B | 301,044 B | **+8 KB (~+2.8%)** — not a reduction |
| Bottleneck | SSR + hydration volume | Same | Unchanged |

Phase 6 removed `colors`/`labels`/`categories[]` from client props and fixed cache tags, but **did not reduce how many products or category rows are serialized**. Payload stayed flat or slightly grew due to explicit `CatalogCardProduct` mapping overhead and unchanged card count.

### Measurable Phase 7 target

| Metric | Current | Target |
|--------|---------|--------|
| `/products` RawContentLength | ~301 KB | **< 210 KB** (~30% reduction) |
| Serialized products on page 1 (proxy: `defaultVariantId` count) | 35 | **< 18** (~50% reduction) |
| Initial hydrated `ProductCard` instances (visible, not serialized-only) | ~12–16 (2–4 cols × up to 4 visible rows across 6 carousels) | **< 10** |
| Warm TTFB | ~450 ms | No regression > 550 ms |

---

## Current architecture

### Server components

| Component / function | Role |
|---------------------|------|
| `ProductsPage` | Shell, decorative backgrounds, Suspense boundaries |
| `ProductsPageMainSlot` | Fetch products, build category rows, paginate rows, pass props to client carousels |
| `ProductsPageSidebarSlot` | Category tree + nav previews → sidebar |
| `getProducts` / `fetchProductsCached` | Always `page=1`, `limit=120` (returns 94 today) |
| `buildCategoryRows` | Groups all fetched products by primary category |
| `toCatalogCardProduct` | Maps to slim client type before serialization |

### Client components (mounted on `/products`)

| Component | Role | Lazy today? |
|-----------|------|-------------|
| `ProductsCategoryCarousel` | Grid, client sort, row expand/collapse | **No** |
| `ProductCard` (+ Grid, Info, Link) | Every visible card; add-to-cart, currency | **No** |
| `ProductsShopToolbar` | Sort via URL | No |
| `ProductsCategorySidebar` | Desktop category rail | No (SSR-fed props) |
| `ProductsMobileCategoriesDrawerLazy` | Mobile categories drawer | **Yes** (`dynamic`, `ssr: false`) |
| Global: `ClientProviders`, `Header`, `Footer` | Site chrome | N/A |

**Not mounted:** `BrandFilter`, `ColorFilter`, `SizeFilter`, `PriceFilter`, `ProductsGrid`, `ProductsHeader`

### Data flow

```
searchParams
  → buildProductFilters
  → unstable_cache(JSON.stringify(filters)) [tag: products-list]
  → productsService.findAll (page=1, limit=120) — always full first batch
  → normalizeProduct → buildCategoryRows (18 rows)
  → slice 6 rows/page (URL page = category-row page, NOT product page)
  → per row: ALL row.products → toCatalogCardProduct → ProductsCategoryCarousel (client)
  → carousel client-sorts, renders visibleRows × columnsPerRow (initially 1 row = 2–4 cards)
  → ProductCard (client) per displayed card
```

Parallel sidebar:

```
getCategoryTreeCached + getCategoryNavPreviews → ProductsCategorySidebar (client)
```

### Product count fetched vs rendered

| Stage | Count | Notes |
|-------|-------|-------|
| **Fetched from DB/API path** | **94** (cap 120) | Same for `?page=2` — URL page does not reduce fetch |
| **Category rows total** | **18** | 3 pages × 6 rows |
| **Category rows on page 1** | **6** | |
| **Products serialized to client (page 1)** | **35** | All products in 6 visible category rows |
| **Products initially visible in carousels (page 1)** | **~12–16** | 6 carousels × 2–4 cols × 1 visible row each |
| **Hidden within carousel but still serialized** | **~19–23** | e.g. Соусы row: 14 serialized, ~2–4 shown |

### Category row behavior

| Question | Answer |
|----------|--------|
| Rows on first page | **6** (`ROWS_PER_PAGE = 6`) |
| Products per row rendered initially | **2–4** (responsive `useVisibleCards`, min 2) |
| Collapsed carousel products serialized? | **Yes** — full `row.products` array passed to client |
| Below-fold rows rendered immediately? | **Yes** — all 6 rows SSR + hydrate on page 1 |
| URL `page=2` fetch scope | Still **94 products** fetched; only rows 7–12 rendered (27 products serialized) |
| Rows built server-side? | **Yes** — `buildCategoryRows` on server |
| Client-side row grouping? | **No** — only sort + within-row expand |

### Cache behavior

| Layer | Tag / key | Admin invalidation |
|-------|-----------|-------------------|
| `unstable_cache` products | `products-list` | `revalidateTag('products-list')` **now present** (Phase 6) |
| Admin revalidator | also `products`, `revalidatePath('/products')` | Fixed in Phase 6 |
| Redis listing | `shop:products:v1:{hash}` | `invalidateCatalogRedisCache` |

**Remaining cache note:** Double layer (`unstable_cache` + Redis in `findAll`) still adds complexity but is not the primary payload issue.

---

## Client hydration findings

### ProductCard boundary

| Sub-component | `'use client'` | Actually needs client JS? |
|---------------|----------------|---------------------------|
| `ProductCard.tsx` | Yes | Hooks: `useAddToCart`, `useCurrency`, `useState(imageError)` |
| `ProductCardGrid.tsx` | Yes | Layout only — could be server if parent split |
| `ProductCardInfo.tsx` | Yes | `formatPrice(currency)`, `useTranslation`, inline add-to-cart button |
| `ProductCardLink.tsx` | Yes | `usePrefetchOnHover` — optional; plain `<Link>` works server-side |
| `ProductCardActions.tsx` | Yes | Wishlist/compare — **not used** on `/products` carousel path |

### Required client-only behavior

| Behavior | Why client |
|----------|------------|
| Add to cart | `useAddToCart` — localStorage/API, auth, loading state |
| Currency display | `useCurrency` + `formatPrice` — reacts to `currency-updated` events |
| Carousel row expand | `useState(visibleRows)` — within-row show more |
| Responsive columns | `useVisibleCards`, `useState(isMobile)` |
| Client-side sort | `useMemo` sort when `sortBy` URL param set |
| Sidebar hover width | `ResizeObserver`, DOM measurement |

### Presentational server-feasible parts

| Part | Server-feasible? |
|------|------------------|
| Card shell / layout / image | **Yes** — static markup + `next/image` |
| Title, category label, description | **Yes** — if i18n uses server `t()` |
| Price display (default currency) | **Partial** — server can render AMD default; live switch needs small client island |
| Product link | **Yes** — plain `Link` without prefetch hook |
| Add-to-cart button | **No** — must stay client |

### Smallest safe client island (per card)

```
ProductCardClientActions { id, slug, defaultVariantId, price, stock, inStock, title, image, originalPrice }
+ optional ProductCardClientPrice { price, compareAtPrice, discountPercent } if currency switching required on listing
```

Everything else (image, title, category, link wrapper) can be server-rendered **in a future phase** with moderate refactor. `ProductCard` is also used by `ProductsGrid`, `RelatedProducts` — shared split needed.

### Risks

| Risk | Severity |
|------|----------|
| Currency switch after SSR shows stale formatted price until island hydrates | Medium — mitigated with `suppressHydrationWarning` or client price wrapper |
| Splitting ProductCard breaks grid/list/other pages | Medium — needs shared server shell component |
| Removing serialized products breaks carousel expand | Low — if expand fetches by category client-side |
| Lazy rows cause layout shift | Low — skeleton row headers already exist in page skeleton |

### useCurrency impact

`useCurrency` reads `localStorage` and listens for window events. It forces **every** `ProductCard` to be a client component today. Server can render default currency (AMD); a **small per-card price island** (~15 lines) preserves currency switching without full-card client boundary.

### Wishlist / compare on `/products`

**Not mounted** on listing carousel path. `ProductCardGrid` passes add-to-cart through `ProductCardInfo`, not `ProductCardActions`.

---

## RSC serialization findings

### Fields passed to client (`CatalogCardProduct`)

`id`, `slug`, `title`, `image`, `price`, `compareAtPrice`, `originalPrice`, `discountPercent`, `inStock`, `defaultVariantId`, `stock`, `brand` `{id,name}`, `category`, `description`

Phase 6 removed from client path: `colors`, `labels`, `categories[]`

### Fields actually used on `/products` carousel

| Field | Used? | Where |
|-------|-------|-------|
| `id`, `slug`, `title`, `image` | Yes | Card display, link, cart |
| `price` | Yes | Display + cart |
| `compareAtPrice` | Cart only | `useAddToCart` fallback for `originalPrice` |
| `originalPrice` | Cart only | Passed to cart line |
| `discountPercent` | Yes | Badge in `ProductCardInfo` if > 0 |
| `inStock`, `defaultVariantId`, `stock` | Yes | Add-to-cart |
| `brand` | Partial | Only `brand.name` in `ProductCardInfo` fallback |
| `category` | Yes | Category row label in card |
| `description` | Conditional | Rendered if non-empty string |

### Removable / shrinkable fields (safe on listing path)

| Field | Recommendation |
|-------|----------------|
| `brand: {id,name}` | Replace with `brandName?: string` — **id never used** on card |
| `originalPrice` | Keep one of `originalPrice` / `compareAtPrice` for cart — **not both** if equal semantics |
| `description` | Omit when null/empty at map time — saves bytes on products without subtitle |
| `stock` | Required by `useAddToCart` for qty cap — **keep** |
| `discountPercent` | Keep if discounts shown; else omit |

### Duplicate data

| Duplication | Evidence |
|-------------|----------|
| Category title | Row `<h2>` + each card's `category` string — **intentional** for card UI |
| `originalPrice` + `compareAtPrice` | Both passed; Info ignores both for display; cart uses either — **redundant** |
| Full category product arrays | Serialized even when carousel shows 2–4 of 14 — **main waste** |
| Server fetch 94 + page=2 renders 27 | **67 products fetched but not rendered** on page 2 |

### Payload suspects (ranked)

1. **Full per-row product arrays** — 35 products × ~15 fields on page 1 (biggest win)
2. **Six immediate client carousels** — each hydrates `ProductCard` subtree
3. **Client-side sort duplication** — re-orders already-serialized arrays; sort URLs slightly **increase** payload
4. **`description` strings** — 36 occurrences in HTML for 35 products
5. **`brand` object** — includes unused `id`
6. **Sidebar category nav previews** — separate serialized chunk (small vs product grid)
7. **Decorative `<img>` backgrounds** — 3× on unfiltered page (minor vs RSC product data)

---

## Category row / limit findings

### Current limit

`PRODUCTS_SHOP_LIST_LIMIT = 120` → returns **94** products (full catalog), **18** category rows.

### Category distribution by API limit

| Limit | Returned | Unique categories | Safe for current 3-page row UX? |
|-------|----------|-------------------|--------------------------------|
| 20 | 20 | 3 | **No** — hides 15 categories |
| 40 | 40 | 7 | **No** — hides 11 categories |
| 60 | 60 | 11 | **Partial** — 2 row pages instead of 3; hides 7 categories / 34 products |
| 80 | 80 | 16 | **Near** — hides 2 categories / 14 products |
| 120 | 94 | 18 | **Current** — full catalog |

### Products per page row (current fetch order, `createdAt` desc)

**Page 1 (6 rows, 35 products serialized):**

| Row | Category | Products in row |
|-----|----------|-----------------|
| 1 | Соусы | 14 |
| 2 | Десерты | 5 |
| 3 | Бургеры | 1 |
| 4 | Детское Меню | 4 |
| 5 | Хачапури и Ламаджо | 5 |
| 6 | Пицца | 6 |

**Page 2 (6 rows, 27 products serialized):** Ассорти шашлыков (6), Люля-кебаб (4), Шашлык (12), Стейки (2), Гарниры (2), Паста (1)

### Category-filtered behavior

`?category=sousy`: total=14, all limits ≥14 return full set. Page **176 KB** — proves payload scales with serialized product count.

### Safe reduced limit?

| Scenario | Recommendation |
|----------|----------------|
| Unfiltered `/products` | **Do not drop below 94** without product-owner sign-off — would hide catalog sections |
| Category/search/filter URLs | **Yes** — use `Math.min(meta.total, 40)` or exact total; no UX loss when filtered set is small |
| URL `page=2+` | **Opportunity** — today refetches all 94; could fetch only products needed for rows 7–12 (requires row-aware server query — larger change) |

### UX risk

Reducing global limit is a **product decision**, not pure perf. Per-row cap + lazy rows achieve perf without hiding categories.

---

## Server-first options

| Option | Description | Expected win | Risk | Files | Recommendation |
|--------|-------------|--------------|------|-------|----------------|
| **A** | Keep full client `ProductCard`; only trim props + filtered limits | **5–10%** payload | Low | `catalog-card-product.ts`, `page.tsx` | Incremental; insufficient alone |
| **B** | Split card: server shell (image/info/link) + client actions/price island | **20–35%** hydration; **10–15%** payload | Medium | `ProductCard*`, new server components | **Postpone to Phase 8** — high refactor surface (`ProductsGrid`, `RelatedProducts`) |
| **C** | Server-render first N rows; hydrate only add-to-cart buttons | Overlaps B | Medium–High | Same as B + carousel | Partial server-first; still need islands per card |
| **D** | Keep client cards; lazy below-fold rows + per-row product cap | **30–45%** payload; **40–60%** initial hydration | Low–Medium | `page.tsx`, `ProductsCategoryCarousel.tsx`, new lazy row wrapper | **Recommended for Phase 7** |

### Option D detail (recommended)

- **Above-fold:** SSR rows 0–2 with capped products per row (e.g. 4)
- **Below-fold:** Row headers SSR; `ProductsCategoryCarousel` mounts via `IntersectionObserver` / dynamic import
- **Row expand:** Fetch remaining products via `/api/v1/products?category={slug}&limit=50` on expand (API warm ~50 ms)
- **Does not break add-to-cart** — visible cards still full client `ProductCard` with `defaultVariantId`
- **Currency switching** — unchanged (still client cards on visible products)

### Dynamic imports alone?

Phase 6 added `ProductsMobileCategoriesDrawerLazy` — **helps JS bundle, not RSC payload**. Dynamic-importing `ProductsCategoryCarousel` without deferring props **does not reduce serialization** — parent server component still passes full `products` array at SSR. Must defer **data**, not just component code.

---

## Build / bundle findings

| Item | Value |
|------|-------|
| **Build status** | **Succeeded** (`npm run build --workspace=@shop/web`, compile mode) |
| **`/products` route** | `ƒ` (Dynamic) — server-rendered on demand |
| **First Load JS line** | Not emitted in Next.js 16 compile-mode route table |
| **Analyzer available** | **No** — no `ANALYZE`, `webpack-bundle-analyzer`, or `optimizePackageImports` in config |
| **Bundle analysis** | **Separate future task** — add `@next/bundle-analyzer` once when optimizing client chunks |

### Bundle risks (qualitative)

- `ProductCard` subtree pulls `useAddToCart`, `useCurrency`, `i18n-client`, `next/image`
- `ProductsCategoryCarousel` × 6 instances on page 1 multiplies hook overhead
- Global `Header`/`ClientProviders` baseline unavoidable on all pages

---

## Cache / invalidation status

| Check | Status |
|-------|--------|
| `/products` `unstable_cache` uses `products-list` tag | **Yes** — `page.tsx` line 58 |
| Admin invalidation calls `products-list` | **Yes** — Phase 6 added to `cache-revalidator.ts` |
| `revalidatePath('/products')` still present | **Yes** |
| Remaining mismatch | **None critical** — Phase 6 cache tag gap **closed** |

---

## Recommended Phase 7 implementation

**Choose ONE combined plan:** **Option D — defer volume (lazy rows + per-row product cap + prop trim + filtered fetch cap)**

### Goal

Cut `/products` RSC payload and initial hydration by reducing **how many products cross the server→client boundary**, without hiding catalog categories, breaking add-to-cart, or currency switching.

### Why this plan (not micro-phases)

Phase 6 already did prop slimming, cache tags, and drawer lazy-load. The remaining cost is **volume**: 35 products serialized on page 1 while ~12–16 render; 6 carousels hydrate immediately; `page=2` still processes 94 products server-side. Option D targets the measured waste directly. Full server-first `ProductCard` (Option B) is higher risk and should follow in Phase 8 once row volume is under control.

### Tasks

1. **Per-row SSR product cap**
   - In `ProductsPageMainSlot`, pass `initialProducts = row.products.slice(0, INITIAL_ROW_PRODUCTS)` (recommend **4**) + `categorySlug` + `totalInRow` to carousel.
   - On carousel row expand, fetch `/api/v1/products?category={slug}&limit=50&lang=…` client-side (reuse existing warm API).
   - Preserve client-side sort within fetched set.

2. **Lazy below-fold category rows**
   - SSR rows with `index < 3` immediately (above-fold).
   - Rows `index >= 3`: render category `<h2>` server-side; wrap `ProductsCategoryCarousel` in `LazyCategoryProductsSection` with `IntersectionObserver` (rootMargin ~200px) or `dynamic(..., { ssr: false })` + skeleton.
   - Preserves SEO for category headings; defers card hydration.

3. **`CatalogCardProduct` prop trim (low risk, include in same PR)**
   - `brandName?: string` instead of `brand` object.
   - Omit null/empty `description`.
   - Single strikethrough source: keep `compareAtPrice` OR `originalPrice` for cart, not both when identical semantics.

4. **Filtered URL fetch cap**
   - When `category`, `search`, or facet params present: `limit = Math.min(meta.total, 40)` instead of 120.
   - Unfiltered shop: keep `PRODUCTS_SHOP_LIST_LIMIT = 120` (94 effective) until product owner approves catalog truncation.

5. **Do NOT in Phase 7**
   - Full `ProductCard` server split
   - Global limit reduction below 94
   - DB sort / remove client sort
   - Mount orphan facet filters
   - Bundle analyzer setup

### Expected files (~6–10)

| File | Change |
|------|--------|
| `apps/web/app/(main)/products/page.tsx` | Row cap, lazy row split, filtered limit |
| `apps/web/components/ProductsCategoryCarousel.tsx` | Expand fetch, accept capped initial products |
| `apps/web/components/products/catalog-card-product.ts` | Prop trim |
| `apps/web/components/products/LazyCategoryProductsSection.tsx` | **New** — intersection observer wrapper |
| `apps/web/components/products/fetch-category-row-products.ts` | **New** — client fetch helper |
| `apps/web/lib/services/products-find-query/query-builder.ts` | Only if filtered limit needs `meta.total` pre-read |

### Success metric

| Metric | Target |
|--------|--------|
| `/products` RawContentLength | **< 210 KB** (from ~301 KB) |
| Page 1 `defaultVariantId` count in HTML | **< 18** (from 35) |
| Add-to-cart on first visible card | Works without extra product fetch |
| Carousel expand (Соусы 14 items) | Loads remaining products on expand |
| `/products?category=sousy` | No regression; size stays ~176 KB or lower |
| Warm TTFB | ≤ 550 ms |

### Tests

1. `/products` default — 6 row headers, first rows show cards, below-fold rows appear on scroll.
2. Expand carousel row with 14 products — remaining products load, add-to-cart works on newly shown cards.
3. Sort URLs (`price-asc`, `name-desc`) — order correct within each row after expand fetch.
4. `?page=2` — rows 7–12 render; no duplicate/missing categories.
5. `?category=sousy` — all 14 products reachable via expand; payload not regressed.
6. Currency switch in header — visible card prices update after hydration.
7. Admin product edit — listing updates (cache tags still work).

### Stop conditions

1. Expand fetch returns wrong category products or breaks sort order vs current baseline.
2. Lazy rows never mount or cause broken pagination anchors.
3. Add-to-cart regresses (missing `defaultVariantId` / `stock` on capped props).
4. Layout shift exceeds acceptable threshold on mobile (measure manually).
5. Product owner rejects below-fold lazy behavior — fall back to task 1 + 3 only.

### Commit message

```
perf(products): reduce shop SSR payload with lazy rows and capped carousel data
```

### Combined implementation safe

**Yes** — Low–Medium risk. Measurable payload win without catalog truncation or full card rewrite.

### Risk level

**Low–Medium**

---

## Postponed items

| Item | Reason |
|------|--------|
| Full server-first `ProductCard` split (Option B/C) | High refactor; used on multiple pages; Phase 8 |
| Global `PRODUCTS_SHOP_LIST_LIMIT` reduction below 94 | Hides catalog categories — product owner decision |
| Row-page-aware server fetch for `?page=2` | Larger query refactor; defer unless Phase 7 insufficient |
| DB sort replacing client carousel sort | Medium scope; not payload-critical |
| `dynamic(ProductsCategoryCarousel)` without data deferral | Moves JS only; Phase 7 audit proved insufficient |
| Bundle analyzer / First Load JS optimization | No analyzer configured; separate task |
| Mount orphan facet filters / BrandFilter | Out of scope |
| Category-row vs product-level pagination redesign | UX product decision |
| Decorative background `<img>` → CSS | Minor bytes; optional cleanup |

---

## Summary

| Item | Finding |
|------|---------|
| **Why payload still large** | Phase 6 trimmed fields per product, not **product count** crossing client boundary |
| **Main waste** | 35 products serialized page 1; ~19 hidden in collapsed carousels; 6 rows hydrate immediately |
| **ProductCard server-first** | **Feasible** in Phase 8; smallest island = actions + optional price; not recommended for Phase 7 |
| **Lazy below-fold rows** | **Safe** with SSR headers + intersection-mounted carousels |
| **Initial limit reduction** | **Unsafe globally** (hides categories); **safe when filtered** |
| **Phase 7 plan** | Lazy rows + per-row cap + prop trim + filtered fetch cap |

**One-sentence recommendation:** Phase 7 should stop shipping full category product arrays for every row on first paint—cap visible-row data, lazy-load below-fold rows, and trim remaining card props—while postponing full server-first ProductCard to Phase 8.
