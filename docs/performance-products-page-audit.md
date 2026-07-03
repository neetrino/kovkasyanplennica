# /products Performance Audit

**Date:** 2026-07-03  
**Type:** DEBUG / AUDIT ONLY — no production code changes, no commit, no push  
**Production URL:** https://kovkasyanplennica.vercel.app/products  
**Branch audited:** `dev-Karo` (local codebase; production deploy matches pre–Phase-1-push state)

---

## Summary

| Metric | Cold (curl / first byte) | Warm (browser, cached assets) | Notes |
|--------|--------------------------|-------------------------------|-------|
| **Document TTFB** | **~510 ms** | **~69 ms** | Cold = full SSR on Vercel (`X-Vercel-Cache: MISS`) |
| **Total load time** | **~694 ms** (HTML only) | **~711 ms** (`loadEventEnd`) | Warm session; images/JS mostly disk cache |
| **LCP** | Not reliably captured (warm nav) | — | Likely product image or decorative PNG on cold load |
| **HTML size** | **225,450 B** (~220 KB) | same | 35 serialized products, 23 RSC chunks |
| **Total JS (encoded)** | ~227 KB (13 chunks) | transfer **0 B** (cache) | Shared app shell + `/products` client islands |
| **Total images (encoded, warm)** | — | **~2.26 MB** | Dominated by **one** `union-decorative.png` (2.31 MB) |
| **Image requests** | — | **20** | No `/api/*` listing calls from browser |
| **Main bottleneck** | **Dynamic SSR + heavy server data path + unoptimized images** | | Server work on every cold visit; images brutal on first paint |
| **Confidence** | **High** for architecture/cache/images; **Medium** for exact DB ms (no local Neon timing in this session) | | Phase 6/7 local traces corroborate |

**Headline:** `/products` is slow because every visit triggers **full dynamic SSR** (ISR/CDN disabled), which runs **two parallel heavy server slots** (120-product deep Prisma fetch + ~18 category nav preview DB batches) and ships a **~220 KB HTML/RSC payload** with **35 client-serialized products**. On the image side, production still loads **2.3 MB decorative PNG** and **multi‑MB source JPGs** for desserts and sidebar previews — Phase 1 helpers exist in repo but are **not applied on `/products` page shell** and **not deployed to production** yet.

---

## Request Flow

```
Browser GET /products
  │
  ├─ Vercel edge → Next.js (dynamic route: searchParams awaited)
  │     Cache-Control: private, no-store │ X-Vercel-Cache: MISS
  │
  ├─ ProductsPage (RSC shell) — streams immediately
  │     ├─ 3× <img union-decorative.png> via toR2Url (NOT optimized helper)
  │     │
  │     ├─ Suspense #1 ─ ProductsPageSidebarSlot (parallel)
  │     │     getCategoryTreeCached(lang)
  │     │       → categoriesService.getTree → withRedisCache(categoryTreeKey)
  │     │       → db.category.findMany (+ children, translations)
  │     │     flattenCategories → ~17 flat categories
  │     │     getCategoryNavPreviews(lang, 18 targets)
  │     │       → unstable_cache ['category-nav-previews-v3']
  │     │       → resolveNavPreviewTargets (batches of 6)
  │     │       → ~1 + 17× findPreviewForCategory (2 DB ops each)
  │     │     → ProductsCategorySidebar (client, SSR props)
  │     │
  │     └─ Suspense #2 ─ ProductsPageMainSlot (parallel)
  │           getProducts(page=1, limit=120)
  │             → fetchProductsCached(JSON.stringify(filters))
  │               → unstable_cache ['main-products-list-v2']
  │               → productsService.findAll
  │                 → withRedisCache(productListKey)
  │                 → tryFetchProductsViaMeilisearch (skipped unless search param)
  │                 → buildQueryAndFetch → executeProductQuery(take=1200)
  │                 → filterProducts (in-memory) → slice 120 → transformProducts
  │           normalizeProduct → buildCategoryRows → slice 6 rows/page
  │           → ProductsCategoryCarousel × 6 (client, full row.products[])
  │               → ProductCard (client) × visible cards (~12–21)
  │
  └─ Browser hydrates client islands (carousel, sidebar, toolbar, cart/auth providers)
        No /api/v1/products from browser — all listing data is SSR/RSC
```

---

## Browser Requests

Measured on production in Cursor browser (warm session, 2026-07-03) plus cold curl for document.

| Request | Type | Size (encoded / transfer) | Duration | Priority | Cache status |
|---------|------|---------------------------|----------|----------|--------------|
| `GET /products` | document | 225 KB / ~22 KB transfer (warm) | TTFB 69 ms warm; **510 ms cold** | Highest | `X-Vercel-Cache: MISS`, `Cache-Control: private, no-store` |
| `/_next/static/chunks/*.js` (×13) | script | **~227 KB total** / 0 B transfer | 7–13 ms each | — | Disk cache (warm) |
| `union-decorative.png` (R2) | image (preload + img) | **2,310,581 B** / 300 B transfer | ~158 ms | preload + img | 304/disk cache; **full 2.3 MB on cold** |
| `hero-logo.png`, `logo-kp2.png` | image | ~27 KB each | ~126–145 ms | preload | Cached |
| Product images (R2 menu/import/*) | image | **0 B transfer** (warm); JPG sources **7–13 MB** each on CDN | 7–57 ms | img/link | Warm cache; cold = huge for `.jpg` rows |
| Sidebar preview images (in RSC/HTML) | image | Same R2 URLs; several **10–13 MB JPGs** | varies | `imagePriority` first 8 sidebar rows | Not optimized on production |
| `/api/v1/products` or filters | — | **None observed** | — | — | Listing is **server-side only** |
| Fonts (Sansation woff2) | font | preloaded in Link header | — | preload | — |

**Important:** No browser `/api/products` request appears on initial `/products` load. Data comes from direct server service calls (`productsService.findAll`, `categoriesService.getTree`, `getCategoryNavPreviews`).

---

## Server Function Trace

Timings: production TTFB (~510 ms cold) bounds total server work. Per-step durations below combine **Phase 7 local dev measurements** (~450 ms warm page render) with code analysis. Local one-off `[products-perf]` script did not complete (Neon/Redis env timeout in this session).

| Step / function | File | Duration (est.) | Cache hit/miss | Data count | Notes |
|-----------------|------|-----------------|----------------|------------|-------|
| `ProductsPage` shell | `app/(main)/products/page.tsx` | <5 ms | — | — | Awaits `searchParams` → **dynamic** |
| `ProductsPageSidebarSlot` | same | **~150–400 ms** (parallel) | tree + previews: miss on cold | ~17 flat cats, **18 preview targets** | Runs parallel with main slot |
| `getCategoryTreeCached` | `page.tsx` | ~20–80 ms | `unstable_cache` + Redis `categoryTreeKey` | 1 `findMany` + children | Redis 3600s TTL |
| `flattenCategories` | `CategoryNavigation/utils.tsx` | <1 ms | — | **17** categories | |
| `getCategoryNavPreviews` | `products-nav-preview.service.ts` | **~100–300 ms** cold | `category-nav-previews-v3` | **18** previews | See category section |
| `ProductsPageMainSlot` | `page.tsx` | **~200–500 ms** (parallel) | product list miss on cold | **120 limit → 94 products** (catalog size) | Dominates SSR |
| `getProducts` / `fetchProductsCached` | `page.tsx` | included above | `main-products-list-v2` | filters JSON key | Double cache w/ Redis inside |
| `productsService.findAll` | `products.service.ts` | included | Redis `productListKey` | returns **120** after slice | |
| `tryFetchProductsViaMeilisearch` | `products-find-meilisearch.service.ts` | skipped | — | — | Only when `search` param set |
| `buildQueryAndFetch` | `products-find-query.service.ts` | included | — | — | |
| `executeProductQuery` | `query-executor.ts` | **~80–250 ms** Prisma | — | **take=1200**, **~94 rows** returned today | Deep includes |
| `filterProducts` | `products-find-filter.service.ts` | ~1–5 ms | — | 94 → 94 | In-memory filters |
| `transformProducts` | `products-find-transform.service.ts` | **~20–80 ms** | discount settings Redis | **120** serialized fields | Heavy per-product mapping |
| `buildCategoryRows` | `page.tsx` | <5 ms | — | **18 rows** total, **6 rendered** page 1 | |
| `ProductsCategoryCarousel` ×6 | client | hydration ~200–400 ms | — | **35 products** in RSC props page 1 | Full row arrays serialized |

---

## Product Query Analysis

| Field | Value |
|-------|-------|
| **Requested limit** | `PRODUCTS_SHOP_LIST_LIMIT = 120` |
| **rawFetchTake(limit)** | `min(120 × 10, 4000) = **1200**` |
| **DB rows fetched (current catalog)** | **~94** (published products; cap not reached) |
| **After in-memory filter** | ~94 |
| **After pagination slice** | **120 max** (all 94 returned) |
| **Final products rendered (page 1)** | **35** in 6 category rows (~12–21 visible in carousel) |
| **Meilisearch** | **Skipped** on default `/products` (no `search` param) |

### Includes / relations loaded (`query-executor.ts`)

- `translations`
- `brand.translations`
- `variants` (published) → `options` → `attributeValue` → `attribute`, `translations`
- `labels`
- `categories.translations`
- `productAttributes` → `attribute` → `translations`, `values.translations`

**Overfetch risk:** **Critical.** Shop cards need slug, title, price, image, stock, primary category, default variant — but the query loads **full variant option graphs and productAttributes** suitable for PDP/filters, not list cards. As catalog grows toward 1200 take, cost scales linearly.

**Transformation cost:** `transformProducts` runs discount logic, category fallback lookups, image URL processing, and color extraction for **every paginated product** — acceptable at 94 products but heavy relative to card-only needs.

**Serialized payload:** HTML contains **35× `defaultVariantId`**, **41× `description`**, full `brand`, `colors`, `labels`, `categories[]` per product in RSC props — far more than carousel cards display.

---

## Category Query Analysis

| Field | Value |
|-------|-------|
| **Category tree** | 1× `db.category.findMany` with nested `children` + `translations` |
| **Flat category count** | **17** (+ `all` nav chip = **18 preview targets**) |
| **Preview DB queries (cold cache)** | **~35** round-trips: 1× `findPreviewForAll` + 17× (`getAllChildCategoryIds` + `findMany` take 15) |
| **Concurrency** | Batches of **6** (`NAV_PREVIEW_CONCURRENCY`) |
| **Preview duration (est.)** | **100–300 ms** cold; <20 ms if `unstable_cache` + Redis warm |
| **Cache keys** | `unstable_cache`: `category-nav-previews-v3`; Redis: `categoryTreeKey(lang)` |
| **N+1 pattern** | **Yes** — one preview resolution path per category slug (not one SQL for all) |
| **Images on initial load** | Sidebar renders **18 preview thumbnails**; first **8** use `imagePriority`. URLs are **raw R2** (many multi‑MB JPGs in serialized previews). |

**Are all preview images needed on first load?** **No.** Only ~8–10 are above the fold on desktop; mobile hides sidebar but **still pays SSR cost** to build all 18 previews.

**Client refetch?** **No** on `/products` when `initialCategoryNavPreviews` is passed from RSC (`useCategoryProducts` skips API). Browser **does not** call `/api/v1/products/category-nav-previews` on initial load.

---

## Image Analysis

### Top largest assets (CDN `Content-Length`, production R2)

| Asset | Size |
|-------|------|
| `shashlyk-baranina-parnaya-….jpg` | **13.7 MB** |
| `holodnye-zakuski-syrnaya-tarelka-….jpg` | **13.6 MB** |
| `hachapuri-i-lamadzho-lamadzho-iz-govyadi-….jpg` | **12.8 MB** |
| `pitstsa-pitstsa-s-ohotnichimi-kolbaskami-….jpg` | **12.8 MB** |
| `supy-hashlama-….jpg` | **12.7 MB** |
| `goryachie-zakuski-kurinye-krylyshki-….jpg` | **12.0 MB** |
| `deserty-krasnyi-barhat-….jpg` | **9.4 MB** |
| `deserty-medovik-….jpg` | **7.6 MB** |
| **`union-decorative.png`** | **2.3 MB** |
| Optimized WebP exists (not used on prod HTML): `…-400w.webp` | **~63 KB** |

### Duplicate / decorative images

| Issue | Evidence |
|-------|----------|
| **`union-decorative.png` ×3** | `page.tsx` lines 470–479 — three identical `<img src={toR2Url('/assets/hero/union-decorative.png')}>` |
| **8 mentions in HTML** | RSC payload duplicates URL strings |
| **Browser dedupes network** | One encoded 2.31 MB entry on warm load; cold still downloads full PNG once |

### Old JPG/PNG still loaded on production `/products`

- **Yes.** HTML/RSC contains **0** `optimized/` or `400w.webp` URLs.
- Dessert row product cards use **9 MB JPG** sources in production.
- Sidebar nav previews reference **10–13 MB JPG** category hero images.
- **`union-decorative.png`** (not WebP) loaded via raw `toR2Url`.

### Phase 1 optimized helpers — applied on `/products`?

| Helper | Used on `/products`? |
|--------|----------------------|
| `toOptimizedProductCardUrl` | **In repo** (`ProductCardGrid.tsx`) — **not on production deploy** (JPG URLs in live HTML) |
| `toOptimizedDecorativeUrl` | **No** — `page.tsx` uses `toR2Url` |
| `toOptimizedHeroUrl` | N/A on products page |

Phase 1 commit (`c335ba5`) is **local, not pushed** — production behavior matches pre-optimization.

### Cold-load image transfer estimate (first visit, no cache)

Conservative estimate for visible + priority assets:

- Decorative PNG: **~2.3 MB** (×1 network, ×3 DOM)
- ~4 dessert JPG cards: **~35 MB**
- ~8 sidebar preview JPGs: **~50+ MB** potential if all priority/load
- **Total image risk: 40–90 MB** on uncached first load vs **~2.3 MB** warm measured (cache masked the problem)

---

## Client / Hydration Audit

| Component | Client? | Cost |
|-----------|---------|------|
| `ProductsCategoryCarousel` | **Yes** | Sort `useMemo`, resize listener, row expand state; mounts **6×** on page 1 |
| `ProductCard` / `ProductCardGrid` | **Yes** | `useAddToCart`, `useCurrency`, image error state; **every visible card** |
| `ProductsShopToolbar` | **Yes** | Sort URL navigation |
| `ProductsCategorySidebar` | **Yes** | `ResizeObserver` pill width, `useSearchParams`; fed by SSR props |
| `ProductsMobileCategoriesDrawer` | **Yes** | Re-mounts sidebar in drawer |
| `ClientProviders` | **Yes** | Auth, prefetch, toast; `SpinWheelPopup` **disabled on `/products`** (`pathname !== '/'`) |
| Global header/footer | **Yes** | Shared chrome |

**Hydration gap:** Warm `domInteractive` **499 ms** − TTFB **69 ms** ≈ **430 ms** client parse/hydrate after HTML arrives. Cold TTFB **510 ms** + similar hydrate → **~900 ms+** to interactive.

**JS chunks:** ~227 KB encoded across 13 scripts (framework + shared + route client components). No products-specific API lazy loading — all listing data embedded in RSC.

**Serialized vs visible:** **35 products** hydrated into client trees; only **~12–21** visible (6 carousels × 1 row × 2–4 cols). Remaining products in each row are **serialized but hidden** until “show more row”.

---

## Cache Audit

| Layer | Key / tag | TTL | Effective in production? |
|-------|-----------|-----|--------------------------|
| Page ISR | `revalidate = 3600` | 3600s | **No** — `searchParams` forces dynamic SSR |
| `unstable_cache` products | `main-products-list-v2` + filter JSON | 3600s | **Partial** — helps repeat renders same filters on same instance; **not CDN** |
| `unstable_cache` category tree | `products-shop-category-tree-v2` | 3600s | Same |
| `unstable_cache` nav previews | `category-nav-previews-v3` | 3600s | Same |
| Redis | `productListKey`, `categoryTreeKey`, `categorySlugKey` | 3600s | **Yes** when Upstash reachable; reduces Neon on warm |
| Vercel CDN | — | — | **`X-Vercel-Cache: MISS`**, `Age: 0`, **`Cache-Control: private, no-store`** every check |

**Why ISR fails:** `ProductsPage({ searchParams })` awaits `searchParams` → Next.js 15 marks route **dynamic**. Combined with `--experimental-build-mode=compile`, static `/products` HTML is not served from edge.

**Double caching:** `unstable_cache` wraps `findAll`, which **also** uses `withRedisCache` — adds complexity; not primary bottleneck vs query shape.

**getStoredLanguage:** Server always returns **`ru`** (`localStorage` unavailable on server) — does **not** by itself force dynamic rendering; **`searchParams` does**.

---

## Ranked Root Causes

### 1. Dynamic SSR on every request (ISR/CDN disabled)

- **Evidence:** `Cache-Control: private, no-store`, `X-Vercel-Cache: MISS`, `searchParams` awaited in `ProductsPage`; cold TTFB **510 ms** every curl.
- **Files:** `apps/web/app/(main)/products/page.tsx`
- **Fix direction:** Static shell for default `/products`; move filters to client or optional segment; or `export const dynamic = 'force-static'` for default view with client-side filter islands.
- **Risk:** Medium — URL/filter behavior must stay correct.

### 2. Unoptimized images on `/products` (decorative + product JPGs)

- **Evidence:** 3× `union-decorative.png` (2.3 MB); dessert JPGs 7–9 MB in production HTML; 0 optimized URLs; CDN has `-400w.webp` at 63 KB.
- **Files:** `page.tsx` (`toR2Url`), `ProductCardGrid.tsx` (helper exists but not deployed), sidebar preview URLs in RSC.
- **Fix direction:** Phase 2A — `toOptimizedDecorativeUrl`, map product + preview images through `toOptimizedProductCardUrl` at **server transform** time; deploy Phase 1.
- **Risk:** Low.

### 3. Product query overfetch (deep Prisma includes for list view)

- **Evidence:** `rawFetchTake(120)=1200`; includes variants/options/attributes/productAttributes; transform builds colors/labels/descriptions for 120 products; only 35 serialized to page.
- **Files:** `query-executor.ts`, `products-find-transform.service.ts`, `page.tsx`
- **Fix direction:** Phase 2B — listing-specific `select` (slug, title, price, media, primary category, default variant stock); fetch only products needed for **6 visible category rows** or paginate at DB level.
- **Risk:** Medium — filter/sort paths must stay consistent.

### 4. Category nav preview N× DB pattern (sidebar SSR)

- **Evidence:** 18 targets, ~35 DB ops, large preview JPGs in payload; runs on every SSR even on mobile (sidebar hidden).
- **Files:** `products-nav-preview.service.ts`, `ProductsPageSidebarSlot`
- **Fix direction:** Phase 2C — single SQL for previews; lazy-load sidebar previews; mobile-only strip without full preview set.
- **Risk:** Medium.

### 5. Large RSC/client payload (35 full products × 6 carousels)

- **Evidence:** 225 KB HTML, 35× `defaultVariantId`, descriptions/brands/colors in props; Phase 7 measured ~301 KB locally.
- **Files:** `page.tsx`, `ProductsCategoryCarousel.tsx`, `ProductCard.tsx`
- **Fix direction:** Slim `CatalogCardProduct` type; server-render card shell; client island for add-to-cart only; lazy row mounting.
- **Risk:** Medium–high (shared ProductCard usages).

### 6. Client hydration surface (all cards client components)

- **Evidence:** ~430 ms warm hydrate gap; 6 carousels × ProductCard with cart/currency hooks.
- **Files:** `ProductCard.tsx`, `ProductsCategoryCarousel.tsx`
- **Fix direction:** Phase 2E — server card markup + minimal client actions.
- **Risk:** Medium.

### 7. Cache layer ineffective at CDN (symptom of #1)

- **Evidence:** Always MISS/no-store despite `revalidate=3600` and `unstable_cache`.
- **Files:** `page.tsx`, `public-cache-ttl.ts`, build script `experimental-build-mode=compile`
- **Fix direction:** Phase 2D — fix dynamic static split first; verify tags; consider stale-while-revalidate for default list.
- **Risk:** Low once route is static-capable.

---

## Recommended Phase 2 Implementation Plan

**Do not implement yet.** Staged by impact vs risk.

### Phase 2A — Image / decorative regressions on `/products` (quick win)

1. Replace `toR2Url` → `toOptimizedDecorativeUrl` for all 3 decorative `<img>` on `page.tsx`.
2. Apply `toOptimizedProductCardUrl` in **`products-find-transform.service.ts`** (server-side) so RSC/HTML emits WebP URLs.
3. Map **nav preview** images through card optimizer in `products-nav-preview.service.ts`.
4. Push/deploy Phase 1 assets on R2; verify production HTML contains `-400w.webp`.
5. **Target:** cold image transfer **< 5 MB** for default `/products`.

### Phase 2B — Reduce product query overfetch

1. Add `listing-select` Prisma shape (card fields only) for shop page path.
2. Lower shop fetch: category-row-aware query (only products in 6 rows) or `limit` aligned to visible need (~40–50).
3. Remove `rawFetchTake ×10` for shop default when no facet filters active.
4. **Target:** Prisma duration **< 100 ms** warm; payload **< 150 KB** HTML.

### Phase 2C — Category preview / sidebar

1. Replace per-slug preview loop with **one grouped query** (or materialized preview table).
2. Defer sidebar preview images below fold (`loading="lazy"`, drop `imagePriority` except top 3).
3. Mobile: skip full preview SSR — categories list only.
4. **Target:** preview DB ops **≤ 3**; sidebar SSR **< 50 ms** warm.

### Phase 2D — ISR / CDN / cache

1. Split default `/products` into static page + client searchParams for filters.
2. Re-test `X-Vercel-Cache: HIT` and `s-maxage` on document.
3. Align `unstable_cache` tags with admin revalidation (already `products-list` post–Phase 6).
4. **Target:** cold TTFB **< 200 ms** from edge on default view.

### Phase 2E — Client hydration / carousel (if still needed)

1. Server-render card grid for first row; client expand for extra rows.
2. Split `ProductCard` into server shell + `ProductCardActions` client island.
3. Virtualize or lazy-mount carousels below fold.
4. **Target:** hydrate gap **< 200 ms**; LCP **< 2.5 s** on 4G.

---

## Stop Conditions

- **No commit.** This audit is documentation only.
- **No push.**
- **No production code changes** were made for this audit.
- Temporary `[products-perf]` timing script was attempted locally but did not complete (env/DB timeout); no instrumentation left in codebase.

---

## Appendix — Key file references

| Area | Path |
|------|------|
| Products page | `apps/web/app/(main)/products/page.tsx` |
| Product find orchestration | `apps/web/lib/services/products-find.service.ts` |
| Query builder / executor | `apps/web/lib/services/products-find-query.service.ts`, `query-executor.ts` |
| Nav previews | `apps/web/lib/services/products-nav-preview.service.ts` |
| Category tree | `apps/web/lib/services/categories.service.ts` |
| Image helpers (Phase 1) | `apps/web/lib/image-optimization.ts` |
| Prior debug baselines | `fix-Karo/PHASE_6_PRODUCTS_PERFORMANCE_CLEANUP_DEBUG.md`, `fix-Karo/PHASE_7_PRODUCTS_SSR_PAYLOAD_DEBUG.md` |
