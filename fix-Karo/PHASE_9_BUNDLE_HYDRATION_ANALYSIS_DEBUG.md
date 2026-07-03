# Phase 9 Bundle / Hydration Analysis Debug

**Date:** 2026-07-02  
**Branch:** `dev-Karo`  
**Phase type:** DEBUG / AUDIT ONLY — no production code changes  
**Scope:** Client bundle, route chunks, hydration boundaries, and remaining JS cost after Phase 8 server-first `/products` card work

---

## Git state

| Item | Value |
|------|-------|
| **Branch** | `dev-Karo` |
| **Tracking** | Up to date with `origin/dev-Karo` |
| **Latest commits** | `014168d` perf(products): server-first catalog cards with client islands · `c74c76d` perf(products): reduce shop SSR payload with lazy rows · `56b56ed` perf(products): trim shop page payload and cache tags · `68345bc` perf(products): replace filter scans with shared catalog queries |
| **Phase 8 completed** | **Yes (committed + pushed)** — `014168d` on `origin/dev-Karo` |
| **Local debug/test files** | Pre-existing untracked debug markdown + Phase 5D scripts; modified `PHASE_1_DEBUG_STATUS.md` |
| **Production code changed** | **no** (audit only; `apps/web/next-env.d.ts` touched by build was reverted) |

---

## Prior reports confirmed

| Finding | Still true |
|---------|------------|
| Phase 8 Debug recommended `/products`-only server card shell + price/cart islands | **Yes** |
| Phase 8 Debug said bundle analyzer was not configured; optional Phase 9 | **Yes** |
| Phase 7 reduced `/products` serialized product waste (`defaultVariantId` 35 → 9) | **Yes** — still **9** on default `/products` |
| Phase 9 should measure bundle/client JS, not redo API/DB work | **Yes** |

---

## Phase 8 verification

| Check | Result |
|-------|--------|
| **Server shell present (`CatalogProductCardShell.tsx`)** | **Yes — file exists (128 lines)** |
| **Server shell wired into `/products` initial path** | **No — dead code; zero imports outside its own file** |
| **Price island present** | **Partial — merged into `ProductCardCatalogIslands.tsx` (106 lines); separate `ProductCardPriceIsland.tsx` not created** |
| **Add-to-cart island present** | **Partial — same combined `ProductCardCatalogIslands.tsx` |
| **`/products` initial path uses legacy `ProductCard`** | **No** — page imports `ProductsCategoryRow` / `LazyCategoryProductsSection` only |
| **`/products` initial path uses full client catalog card** | **Yes** — `ProductsCategoryExpandControls` renders `CatalogProductCardClient` for all cards when no server `children` are passed |
| **Home/PDP/mobile legacy `ProductCard` unchanged** | **Yes** — still imported from `MenuClient`, `Favorites`, `RelatedProducts`, mobile home, `ProductsGrid` |
| **Below-fold / expanded products fallback** | **`CatalogProductCardClient`** (not legacy `ProductCard`) — acceptable for lazy/expand paths, but duplicates server shell markup client-side |

### Phase 8 implementation shape (actual vs planned)

Phase 8 **did** remove legacy `ProductCard` from `/products` and introduced catalog-specific components. It **did not** complete the server-first wiring:

```
ProductsCategoryRow (server)
  └─ ProductsCategoryExpandControls (client)   ← no children passed
       └─ CatalogProductCardClient (client)     ← full card hydrates for every visible card
            └─ ProductCardCatalogIslands (client) ← price + cart only
```

Planned but **not wired**:

```
ProductsCategoryRow (server)
  └─ ProductsCategoryExpandControls (client)
       ├─ children: CatalogProductCardShell (server) × N   ← supported via `children` prop, unused
       └─ fallback: CatalogProductCardClient for expand/lazy fetch
            └─ ProductCardCatalogIslands (client)
```

`ProductsCategoryExpandControls` already supports server children (`hasServerChildren`, lines 77–78, 188–195) but `ProductsCategoryRow` never maps `CatalogProductCardShell` into `children`.

---

## Current page measurements

**Environment:** Local dev, `http://localhost:3000`

| URL | Run 1 | Run 2 | Size (RawContentLength) | defaultVariantId | `__next_f.push` | Notes |
|-----|-------|-------|-------------------------|------------------|-----------------|-------|
| `/products` | 1008 ms | 427 ms | **223,012 B** | **9** | **27** | ~+2.5 KB vs Phase 8 debug (~220 KB); no HTML `ProductCard` strings |
| `/products?category=sousy` | 505 ms | 343 ms | **172,900 B** | **4** | **19** | No regression vs Phase 7/8 (~171–176 KB) |
| `/products?page=2` | 429 ms | 408 ms | **246,953 B** | **12** | **28** | Still large — more rows + lazy placeholders |
| `/products?sort=price-asc` | 469 ms | 761 ms | **249,880 B** | **12** | **28** | Sort does not shrink payload |
| `/products?sort=name-asc` | 832 ms | 949 ms | **249,839 B** | **12** | **28** | Similar to price sort |

### HTML / RSC signals

| Signal | `/products` | Interpretation |
|--------|-------------|----------------|
| `ProductCard` string count | **0** | Legacy component name not in HTML (good) |
| `CatalogProductCardShell` string count | **0** | Expected — component names minified/absent in HTML |
| `ProductCardCatalogIslands` string count | **0** | Expected — client boundary not named in HTML |
| `defaultVariantId` count | **9** | Phase 7 cap preserved |
| `__next_f.push` count | **27** | +2 vs Phase 8 debug (25); minor RSC growth |

**Conclusion:** Phase 8 did **not** cause meaningful HTML regression. Remaining cost is **client JS + hydration**, not SSR byte size. Server-first SSR markup for card shells is **not active** because `CatalogProductCardShell` is unused.

---

## Build output

| Item | Result |
|------|--------|
| **Build status (`npm run build --workspace=@shop/web`)** | **Pass** (compile mode) |
| **Prisma EPERM** | **Yes** — `query_engine-windows.dll.node` locked by dev server; prebuild used existing client |
| **Full `next build` (typecheck)** | **Fail** — unrelated admin TS error in `useProductFormHandlers.ts:376` (pre-existing; blocks First Load JS route table) |
| **`/products` route output** | Listed as `ƒ /products` (dynamic SSR); **no First Load JS sizes** because workspace script uses `--experimental-build-mode=compile` |
| **Relevant warnings** | Build advises running `generate` or `generate-env` mode to finalize; compile-only artifact lacks complete client bundle metadata |

---

## `.next` artifact findings

### Largest static JS chunks (production compile build)

| File/chunk | Size | Notes |
|------------|------|-------|
| `static/chunks/3i-h5i7gxtzb8.js` | **310,853 B** | Largest chunk; no readable component name strings (framework/vendor) |
| `static/chunks/0vr6eflop8zax.js` | **232,564 B** | Shared root main; contains `compare`, framework code |
| `static/chunks/0qi6bjam39h2h.js` | **137,449 B** | Shared root main; `compare`, `Header` strings |
| `static/chunks/10met3a7kmgft.js` | **133,257 B** | `wishlist`, `compare`, `Header` |
| `static/chunks/0cz1d0mv5g_q7.js` | **112,594 B** | Polyfill chunk |
| `static/chunks/3wog16icr__c4.js` | **34,738 B** | **Products route-adjacent** — `ProductsCategoryExpandControls`, `LazyCategoryProductsSection`, `useAddToCart`, `useCurrency`, `useVisibleCards`, `fetchCategoryRowProducts` |
| `static/chunks/07kff-upz2qke.js` | **44,878 B** | Legacy **`ProductCard`**, `useAddToCart`, `useCurrency` — home/PDP shared chunk, not `/products`-specific |
| `static/chunks/1y3np58qyg4c-.js` | **58,529 B** | Legacy **`ProductCard`**, `wishlist`, `compare`, `useVisibleCards` |

### Shared First Load baseline (approximate)

| Group | Size | Notes |
|-------|------|-------|
| `rootMainFiles` (6 chunks) | **~456,773 B** | From `build-manifest.json` |
| Polyfill | **~112,594 B** | `0cz1d0mv5g_q7.js` |
| **Approx shared baseline** | **~569 KB** | Before route-specific lazy chunks; global Header/Footer/ClientProviders dominate |

### Products server artifacts

| Path | Size | Notes |
|------|------|-------|
| `server/app/(main)/products/page/build-manifest.json` | small | Same `rootMainFiles` as global — no route-isolated First Load table |
| `server/app/(main)/products/page/react-loadable-manifest.json` | 2 dynamic imports | Lazy chunks `21soll4800qy-.js`, `1-mhd5k0rzzj6.js` (mobile drawer / toolbar-related) |

### Source maps

| Check | Result |
|-------|--------|
| `*.js.map` under `static/chunks` | **None** — manual chunk inspection is limited to string greps on minified bundles |

---

## Built-chunk symbol search

| Pattern | In `/products`-relevant chunk (`3wog16icr__c4.js`) | In shared chunks | Verdict |
|---------|---------------------------------------------------|------------------|---------|
| `ProductCard` | **No** | **Yes** (`07kff`, `1y3np58qyg4c`, `0pqmvu`) | Legacy card **not** in products expand chunk; still in **global/home/PDP** shared JS |
| `CatalogProductCardShell` | **No** | **No** | Unused in bundle (tree-shaken / never imported) |
| `ProductCardCatalogIslands` | **No** (minified) | bundled inside expand chunk | Combined island ships with expand controls path |
| `ProductsCategoryExpandControls` | **Yes** | — | Primary `/products` client boundary |
| `useAddToCart` / `useCurrency` | **Yes** | **Yes** | Required for cart/price; also in legacy ProductCard chunks |
| `usePrefetchOnHover` | **No** | **No** | Not pulled into products chunks (good) |
| `ProductCardActions` | **No** | **No** | Still dead on listing paths |
| `wishlist` / `compare` | **No** in products chunk | **Yes** in shared chunks | Route-level leakage into `/products` **unlikely**; global layout chrome cost remains |

**Manual chunk search verdict:** Enough to see direction, **not enough** for confident before/after optimization. Proper `@next/bundle-analyzer` treemap is required for Phase 9 implementation.

---

## Bundle / analyzer support

| Check | Result |
|-------|--------|
| **`@next/bundle-analyzer` installed** | **No** |
| **`ANALYZE=true` in `next.config.js`** | **No** |
| **`build:analyze` script** | **No** |
| **`optimizePackageImports`** | Not configured in project config (Next defaults only) |
| **Required package changes for analyzer** | `@next/bundle-analyzer` devDependency + conditional wrap in `next.config.js` + `build:analyze` script + lockfile update |
| **Risk of adding analyzer** | **Low** — dev-only when `ANALYZE=true`; no runtime impact |
| **Acceptable for Phase 9 implementation** | **Yes** — aligns with Phase 8 Debug recommendation |

---

## Client boundary findings

### Current `/products` client islands / boundaries

| Component | `'use client'` | Role | Size |
|-----------|----------------|------|------|
| `ProductsCategoryExpandControls.tsx` | Yes | Row expand/collapse, sort, fetch, grid layout, card picker | 286 lines / 9,075 B |
| `CatalogProductCardClient.tsx` | Yes | **Full card UI** (image, title, category, islands) — used for **all** cards today | 132 lines / 4,888 B |
| `ProductCardCatalogIslands.tsx` | Yes | Price + add-to-cart only (`useCurrency`, `useAddToCart`, `useTranslation`) | 106 lines / 3,441 B |
| `LazyCategoryProductsSection.tsx` | Yes | IntersectionObserver + client fetch + expand controls | ~144 lines |
| `ProductsCategoryCarousel.tsx` | Yes | Thin wrapper → expand controls (lazy path) | 45 lines |
| `CatalogProductCardShell.tsx` | **No (server)** | **Unused** | 128 lines / 4,764 B |
| `ProductsCategoryRow.tsx` | **No (server)** | Passes props only; does not render server shells | 46 lines |

### Global boundaries affecting every route (including `/products`)

| Component | Notes |
|-----------|-------|
| `ClientProviders` | Auth, toast, core prefetch; SpinWheel lazy on `/` only |
| `MainSiteChrome` / `Header` / `Footer` | All `'use client'` — dominate shared `rootMain` chunks |
| `ProductsShopToolbar`, `ProductsCategorySidebar` | Client; sidebar SSR-fed |

### Heavy imports

| Area | Finding |
|------|---------|
| **`ProductsCategoryExpandControls`** | Pulls `useVisibleCards`, `fetchCategoryRowProducts`, `useTranslation`, full expand/fetch state — moderate, justified for UX |
| **`CatalogProductCardClient`** | Duplicates server shell + forces **full card hydration** including `useState(imageError)` and `useTranslation` per card |
| **`LazyCategoryProductsSection`** | Client fetch + expand controls — acceptable for below-fold |
| **Legacy `ProductCard` on `/products`** | **Removed from route** — good |

### Legacy `ProductCard` leakage

| Surface | Leaks into `/products` route chunk? |
|---------|--------------------------------------|
| `/products` page imports | **No** |
| Shared `rootMain` / lazy shared chunks | **Possible indirect cost** if webpack merges home `ProductCard` into shared graph — needs analyzer |
| HTML/RSC payload | **No `ProductCard` strings** |

### Island size concerns

| Island | Assessment |
|--------|------------|
| `ProductCardCatalogIslands` | **Small and focused** — price + cart only; reasonable target client boundary |
| `CatalogProductCardClient` | **Too large for “island”** — entire card is client; this is the main Phase 8 gap |

---

## Route smoke findings

| URL | Status | Size | Notes |
|-----|--------|------|-------|
| `/` | 200 | 210,710 B | Baseline home |
| `/products` | 200 | 223,012 B | Shop default |
| `/products?category=sousy` | 200 | 172,900 B | Filtered |
| `/products?page=2` | 200 | 246,953 B | Large |
| `/products/matsun-sousy` | 200 | 140,609 B | PDP OK |
| `/cart` | 200 | 54,557 B | OK |
| `/wishlist` | 200 | 47,127 B | OK |
| `/compare` | 200 | 47,176 B | OK |

No smoke failures.

---

## Recommended Phase 9 implementation

**Choose ONE:** **Option B — Bundle analyzer + complete Phase 8 server-shell wiring (small, safe client trim)**

Phase 8 removed legacy `ProductCard` from `/products` but **did not activate** `CatalogProductCardShell`. Phase 9 should **measure first**, then **wire the existing server shell** — not blind re-optimization.

### Goal

1. Add reproducible bundle measurement for `/products` First Load JS and hydrated boundaries.  
2. Finish Phase 8 server-first intent: SSR card markup on above-fold rows with **only** `ProductCardCatalogIslands` hydrating per card.  
3. Keep `CatalogProductCardClient` only for expand/lazy client-fetched products.

### Exact approach

1. **Add `@next/bundle-analyzer`** (devDependency) with `ANALYZE=true` conditional in `apps/web/next.config.js` and `build:analyze` script. Capture baseline treemap for `/products` before code changes.
2. **Wire server shell in `ProductsCategoryRow`:** map initial capped products to `<CatalogProductCardShell product={…} locale={lang} />` and pass as `children` to `ProductsCategoryExpandControls`.
3. **Leave expand/lazy paths on `CatalogProductCardClient`** when `children` index is unavailable (expanded rows, client-fetched full row).
4. **Optional small trim (only if analyzer confirms):** split `ProductCardCatalogIslands` price vs cart only if treemap shows benefit; otherwise keep combined island.
5. **Do not** touch legacy `ProductCard` on home/PDP/mobile in Phase 9.
6. **Fix or bypass admin TS error** only if it blocks `build:analyze` full output (separate minimal fix acceptable if required for measurement).

### Files expected

| File | Change |
|------|--------|
| `apps/web/package.json` | Add `@next/bundle-analyzer`, `build:analyze` script |
| `package-lock.json` | Lockfile update |
| `apps/web/next.config.js` | Conditional `withBundleAnalyzer` when `ANALYZE=true` |
| `apps/web/components/products/ProductsCategoryRow.tsx` | Pass `CatalogProductCardShell` children |
| `apps/web/components/products/ProductsCategoryExpandControls.tsx` | Verify/finish server-child index mapping (likely minimal) |
| `PHASE_9_IMPLEMENTATION_REPORT.md` (optional, if team uses post-impl reports) | Measurement before/after |

### Success metric

| Metric | Target |
|--------|--------|
| Bundle analyzer treemap | `/products` client graph documented before/after |
| Above-fold cards | SSR HTML for image/title/category without full `CatalogProductCardClient` hydration |
| Hydrated client boundary per above-fold card | **`ProductCardCatalogIslands` only** (+ expand controls once per row) |
| `/products` RawContentLength | No regression above ~225 KB |
| Add-to-cart + currency switch | Still works on first visible card and expanded rows |
| Legacy `ProductCard` on home/PDP | Unchanged |

### Tests

1. `ANALYZE=true npm run build:analyze --workspace=@shop/web` — treemap opens; save screenshot or stats.
2. `/products` — view-source shows product titles/images in HTML; hydration limited to price/cart buttons.
3. Expand category row — fetched cards still add to cart.
4. `?page=2`, `?category=sousy`, sort URLs — no layout/functional regression.
5. Home menu + PDP related — legacy `ProductCard` unchanged.
6. `/cart`, `/wishlist`, `/compare` — smoke OK.

### Stop conditions

1. Wiring server `children` breaks responsive grid or expand indexing.
2. Analyzer setup requires broad config churn beyond dev-only wrapper.
3. Measured hydration/JS win is zero after shell wiring — stop before further splits.
4. Cart/currency regresses on above-fold cards.

### Commit message

```
perf(products): add bundle analyzer and wire catalog server card shells
```

### Risk level

**Low–Medium** — analyzer is dev-only; shell wiring is scoped to existing Phase 8 components; main risk is expand-control child indexing + layout parity.

---

## Postponed items (do NOT do in Phase 9)

| Item | Reason |
|------|--------|
| Global `ProductCard` refactor for home/PDP/mobile | High blast radius; out of scope |
| DB/API/query changes | Phase 7/5 already optimized data path |
| Remove Header/Footer client boundaries | Site-wide architecture change |
| Split wishlist/compare out of shared chunks globally | Needs broader code-splitting strategy |
| Further SSR byte reduction on `/products` | Diminishing returns; focus JS/hydration |
| Redo Phase 7 lazy row caps | Already working |
| Commit debug markdown or Phase 5D scripts | Local-only artifacts |

---

## Summary

| Item | Finding |
|------|---------|
| **Phase 8 pushed** | **Yes** — `014168d` |
| **Legacy `ProductCard` on `/products`** | **Removed** |
| **Server-first actually active** | **No** — `CatalogProductCardShell` unused; all cards use `CatalogProductCardClient` |
| **Islands** | **Small combined `ProductCardCatalogIslands`** — good target boundary |
| **Analyzer** | **Not configured** — required for confident Phase 9 work |
| **Biggest remaining issue** | **Full client card hydration per visible product** + **~569 KB shared rootMain baseline** |
| **Recommended Phase 9** | **Analyzer + wire existing server shell (Option B)** |

**One-sentence recommendation:** Phase 9 should add `@next/bundle-analyzer` for measurable `/products` client JS baselines, then wire the already-built `CatalogProductCardShell` into `ProductsCategoryRow` so above-fold cards hydrate only `ProductCardCatalogIslands` while keeping `CatalogProductCardClient` for expand/lazy paths.
