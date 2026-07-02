# Phase 1 Debug Status — Kovkasyan Plennica

**Date:** 2026-07-01  
**Purpose:** Pre-implementation investigation for Phase 1 (audit follow-up).  
**Rule:** No application code was changed during this investigation.  
**Reference audit:** `AUDIT_KOVKASYANPLENNICA.md`

---

## 0. Current Repo Status

| Check | Result |
| ----- | ------ |
| **Current branch** | `main` @ `4358f6d` (matches `origin/main`) |
| **Uncommitted files** | **Yes — significant local worktree changes.** ~12 modified TS/TSX/config files, ~90+ deleted files under `apps/web/public/`, plus untracked `AUDIT_KOVKASYANPLENNICA.md`, `backups/`, `scripts/import-menu-from-excel.ts`, `scripts/menu-import/` |
| **Last 10 commits reviewed** | `4358f6d` Merge PR #112 dev-arm · `cf6cf29` Merge main into dev-arm · `087edcd` categories loading ellipsis · `3c22740` ignore tsbuildinfo · `3d69bfd` prefetch · `af6b446` Merge PR #110 · `b984632` single · `b489de6` Merge PR #109 · `a908afa` Merge PR #108 · `0a5cab0` admin |
| **Suspicious recent changes (local, uncommitted)** | **Asset migration in progress:** many `apps/web/public/**` deletions; `apps/web/lib/r2-assets.ts`, `upload-public-assets-to-r2.ts`, `package.json` modified. **`next.config.js`:** R2 pathname widened (`/assets/**` → `/**`). **`SpinWheelPopup.tsx`:** hero SVG paths switched to `toR2Url()` (not lazy-load). **Phase 1 target files (`admin/products/page.tsx`, `query-executor.ts`, `useAttributes.ts`, `ClientProviders.tsx`) are NOT locally modified** — safe baseline for Phase 1 planning. |

**Important:** Phase 1 fixes should be applied on a clean branch from committed `main`, or after the owner reconciles/stashes the asset migration work. Do not mix Phase 1 admin fixes with the in-progress R2 cleanup unless intentional.

---

## 1. Phase 1 Audit Verification

| Item | Audit Claim | Current Status | Evidence File(s) | Code Evidence | Notes |
| ---- | ----------- | -------------- | ---------------- | ------------- | ----- |
| **Admin products stock filter** | Client-side after paginated API fetch | **NOT DONE** | `admin/products/page.tsx`, `admin/products/components/ProductFilters.tsx`, `api/v1/admin/products/route.ts`, `admin-products-read/query-builder.ts`, `product-formatter.ts` | `stockFilter` state (line 33); **not** added to `params` in `fetchProducts` (lines 132–159); client filter lines 167–184; API `validateAndNormalizeFilters` has no `stock` param; `buildProductWhereClause` has no stock logic; `formatProductForList` sets `colorStocks: []` always (line 72) and `stock` from **cheapest variant only** (`variants take: 1`) | Pagination/meta still reflect **unfiltered** server total. Filter can show **fewer than 20 rows** or **empty page** while meta says more pages exist. **Worse than audit:** stock data is incomplete (single variant + empty `colorStocks`). |
| **Admin products search debounce** | Refetch on every filter change; search should be debounced | **NOT DONE** | `admin/products/page.tsx`, `admin/products/components/ProductFilters.tsx`, `admin/products/hooks/useProductHandlers.ts` | `useEffect` deps include `search`, `skuSearch`, `minPrice`, `maxPrice` (line 127); search `onChange` → `setSearch` directly (ProductFilters line 65); **no** `useDebounce`, `useDeferredValue`, or debounce timer in admin products; `handleSearch` only calls `setPage(1)` (useProductHandlers line 29–31) — does **not** gate fetching | **Confirmed from code:** every keystroke in title search triggers `fetchProducts`. SKU field also refetches every keystroke (lines 82–85). |
| **`$queryRaw SELECT 1` hot path** | Runs on every admin product list query | **NOT DONE** | `admin-products-read/query-executor.ts` | Lines 107–110: `await db.$queryRaw\`SELECT 1\`` before every `findMany` | Result unused; health check only. Main `findMany` would fail on DB outage anyway. **Safe to remove in Phase 1** (low risk). |
| **Debug console.log loops (attributes)** | Verbose loops in `useAttributes.ts` | **NOT DONE** | `admin/attributes/useAttributes.ts` | Lines 62–78: nested `forEach` logging every attribute value on **each fetch** | Runs in production path (`fetchAttributes` on mount). High console noise on attributes page. |
| **Debug logs (admin products)** | Audit mentioned attributes; products also noisy | **PARTIALLY DONE** | `admin/products/page.tsx`, `api/v1/admin/products/route.ts`, `admin/products/hooks/useProductHandlers.ts` | Products page: currency/sort logs (lines 57, 71, 207, 260); API route: request timing logs (lines 136, 172); handlers: success logs — **not loops**, but noisy | No nested loops like attributes. Safer cleanup target than attributes loop. |
| **SpinWheelPopup lazy loading** | Eager import in `ClientProviders` | **NOT DONE** | `ClientProviders.tsx`, `SpinWheelPopup.tsx` | Static `import { SpinWheelPopup }` (ClientProviders line 7); `<SpinWheelPopup />` always rendered (line 19); **no** `next/dynamic` | Component **returns null** when closed (line 357–358), but **module still in client bundle**; hooks/effects still run on every page. API fetch gated to `pathname === '/'` + not admin (lines 232–246). Local uncommitted change: R2 URLs only. |
| **Image optimization (investigation only)** | Global `unoptimized: true` + per-component props | **NOT DONE** (unchanged on committed main) | `next.config.js`, 29+ component files | Line 98: `unoptimized: true`; R2 + `cdn.neetrino.com` in `remotePatterns`; ~45 `unoptimized` prop usages across storefront | Local diff only widens one R2 `pathname`. **Do not change in Phase 1 without owner approval + runtime tests.** |

### Additional finding (not in original Phase 1 list, affects admin products)

| Item | Status | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Admin price filter (`minPrice`/`maxPrice`) | **PARTIALLY DONE / broken** | `page.tsx` sends params; API validates them; `ProductFilters` **does not render** price inputs (`_minPrice` unused); `query-builder.ts` **ignores** min/max | State in `useEffect` deps but no UI — dead weight. Not Phase 1 scope unless owner expands. |

---

## 2. What Is Already Done vs Not Done

| Fix Candidate | Status | Evidence | Needs Code Change? | Risk |
| ------------- | ------ | -------- | ------------------ | ---- |
| Admin stock filter → server-side | **Not done, safe to fix** | No API param; client filter lines 167–184 | Yes — page + API route + query-builder + formatter | **Medium** (must fix stock aggregation logic) |
| Admin search debounce | **Not done, safe to fix** | No debounce; useEffect on `search` | Yes — `page.tsx` or small hook | **Low** |
| Admin SKU search debounce | **Not done, safe to fix** | Same pattern as search | Yes — same change | **Low** |
| Remove `$queryRaw SELECT 1` | **Not done, safe to fix** | `query-executor.ts:109` | Yes — one file | **Low** |
| Remove attributes debug log loop | **Not done, safe to fix** | `useAttributes.ts:62–78` | Yes — one block | **Low** |
| Trim admin products debug logs | **Not done, safe to fix** | `page.tsx`, API route | Yes — optional | **Low** |
| SpinWheelPopup lazy load | **Not done, needs runtime verification** | Static import in ClientProviders | Yes — `next/dynamic` | **Low–Medium** (bundle/timing) |
| Image optimization | **Not done, defer** | `next.config.js:98` | Yes — config + many components | **High** — separate approved phase |
| Admin products list general perf | **Partially addressed** | Commit `0a5cab0` refactored table/formatter | No for that subset | — |
| In-memory catalog over-fetch (public) | **Not Phase 1** | Audit Phase 4 | — | **High** — out of scope |

**Git history:** No commit since audit removes `SELECT 1`, adds debounce, server stock filter, lazy SpinWheel, or fixes image optimization. Recent relevant commits: `0a5cab0` (admin refactor, 2026-06-30), `3d69bfd` (ProductCard prefetch, 2026-07-01), `5f27f75` (R2 + global unoptimized, 2026-05-11).

---

## 3. Current Flow Explanations

### Admin Products List Flow

1. **Entry:** `apps/web/app/(main)/admin/products/page.tsx` — client component (`'use client'`).
2. **Auth:** `useAuth()` + redirect effect if not admin (lines 44–51).
3. **State:** `products`, `loading`, `search`, `skuSearch`, `selectedCategories`, `stockFilter`, `page`, `meta`, `sortBy`, `minPrice`, `maxPrice`, `currency`, `selectedIds`, etc.
4. **Categories:** Separate `fetchCategories()` on mount → `GET /api/v1/admin/categories`.
5. **Products trigger:** `useEffect` (line 122–127) calls `fetchProducts()` when auth ready or when **`page`, `search`, `selectedCategories`, `skuSearch`, `stockFilter`, `sortBy`, `minPrice`, `maxPrice`** change.
6. **Request build:** `fetchProducts` builds params: `page`, `limit: 20`, optional `search`, `category`, `sku`, `minPrice`, `maxPrice`, `sort` (only if `sortBy` starts with `createdAt`). **`stockFilter` is omitted.**
7. **API:** `GET /api/v1/admin/products` → `apps/web/app/api/v1/admin/products/route.ts` → `adminService.getProducts(filters)`.
8. **Service:** `admin-products-read/product-operations.ts` → `buildProductWhereClause` + `buildProductOrderByClause` → `executeProductListQuery`.
9. **DB hot path:** `$queryRaw SELECT 1` → `db.product.findMany` (skip/take, includes translations/variants/labels/categories) → `db.product.count` (10s timeout race).
10. **Format:** `formatProductForList` — price/stock from **first/cheapest variant only**; `colorStocks: []`.
11. **Client post-process:** Filter by `stockFilter` in memory (lines 167–184). **`meta` from server is unchanged** (wrong totals when stock filter active).
12. **Sort:** `sortedProducts` useMemo — client sort for `price` and `title`; `createdAt` uses server order.
13. **Render:** `ProductsTable` with `sortedProducts`, pagination from `meta`.

### Admin Search Flow

1. User types in **title search** input → `setSearch(e.target.value)` (ProductFilters line 65).
2. `search` state updates **immediately** on every keystroke.
3. `useEffect` sees `search` change → **`fetchProducts()` immediately** (no debounce).
4. Enter key calls `handleSearch` → only **`setPage(1)`** (does not change fetch timing for typing).
5. **SKU search** same pattern: each keystroke → `setSkuSearch` + `setPage(1)` → refetch.
6. Table shows `sortedProducts`; loading spinner while `loading === true`.
7. **Clear filters:** `handleClearFilters` resets search, categories, sku, stock, page — triggers refetch via effect.

### Admin Stock Filter Flow

1. User selects stock dropdown → `setStockFilter` + `setPage(1)` (ProductFilters lines 167–170).
2. `useEffect` runs `fetchProducts()` (stockFilter in deps).
3. API request **does not include** stock parameter.
4. Server returns page N of **all** products (20 rows).
5. Client filters those 20 rows by summed `colorStocks` or `stock` field.
6. **Effects:** Wrong row count on page; `meta.total` / `totalPages` ignore stock filter; out-of-stock products on other pages never appear when filtering "out of stock" globally.

### SpinWheelPopup Flow

1. **Import:** `ClientProviders.tsx` static-imports `SpinWheelPopup`.
2. **Mount:** Rendered inside `AuthProvider` on **every route** (public + admin) — `(main)/layout.tsx` → `ClientProviders`.
3. **Runtime behavior:** Multiple `useEffect` hooks always run. Prize API **only** when: user interacted, not loading, **not admin**, not dismissed, **`pathname === '/'`**, after 3.5s delay → `GET /api/v1/spin-wheel/active-prizes`.
4. **Render:** Returns `null` until `open && !loading && visiblePrizes.length` (line 357).
5. **Admin pages:** No popup open logic, but **JS for ~708-line component still loaded** with main client bundle.
6. **Dynamic import:** Not implemented. Would defer parse/eval until needed; must preserve home-only + interaction gating.

---

## 4. Unknowns / Questions Before Coding

| Question | Why It Matters | How To Verify | Status |
| -------- | -------------- | ------------- | ------ |
| Does search send a request on every keystroke? | Debounce priority | Code confirms `useEffect` on `search` — **yes** | **Answered (code)** |
| Does stock filter break pagination totals? | Correctness of fix | Code: client filter + server `meta` — **yes** | **Answered (code)** |
| Is `SELECT 1` only a health check? | Safe removal | No use of result; only debug logs after — **yes** | **Answered (code)** |
| Can SpinWheel lazy-load without breaking popup timing? | Bundle vs UX | Need dev build + home page manual test | **NEEDS RUNTIME TESTING** |
| Are R2 image URLs compatible with Next Image optimization? | Image phase gate | Enable locally; test ProductCard, Hero, PDP | **NEEDS RUNTIME TESTING** |
| Are Phase 1 files modified locally? | Merge conflicts | `git status` — Phase 1 files clean; other files dirty | **Answered** |
| What stock definition should server use? | Stock filter implementation | Sum all published variants? Any variant > 0 = in stock? | **Needs owner decision** |
| Do build/lint pass on current tree? | CI safety | Run `npm run lint`, `npm run build` | **NEEDS RUNTIME TESTING** (not run in this investigation) |
| Will asset migration commits land before Phase 1? | Branch hygiene | Owner confirms | **Needs owner decision** |

---

## 5. Recommended Safe Fix Order

| Order | Fix | Why This Order | Files | Risk | Test |
| ----- | --- | -------------- | ----- | ---- | ---- |
| **1** | Remove attributes debug log loop (`useAttributes.ts:62–78`) | Zero behavior change; immediate UX for admins | `apps/web/app/(main)/admin/attributes/useAttributes.ts` | **Low** | Open `/admin/attributes`; no console spam |
| **2** | Remove `$queryRaw SELECT 1` from admin list query | Extra round-trip every list load | `apps/web/lib/services/admin/admin-products-read/query-executor.ts` | **Low** | `/admin/products` loads; pagination works |
| **3** | Add debounced search/SKU (300ms) for admin products | Stops request storm; no API contract change | `apps/web/app/(main)/admin/products/page.tsx` (or new `useDebouncedValue.ts` in `lib/`) | **Low** | Type in search; network tab shows debounced calls |
| **4** | Trim noisy `console.log` in admin products page + API route (keep `console.error`) | Cleaner logs; optional | `page.tsx`, `route.ts` | **Low** | Smoke test admin products |
| **5** | Server-side stock filter | Fixes correctness + perceived perf | `page.tsx`, `route.ts`, `query-builder.ts`, `types.ts`, possibly `product-formatter.ts` / variant aggregation | **Medium** | Stock filter + pagination totals; edge cases multi-variant |
| **6** | Lazy-load `SpinWheelPopup` via `next/dynamic` | Bundle size; behavior should stay same | `ClientProviders.tsx` | **Low–Medium** | Home `/` popup after interaction; admin unaffected |
| **7** | Image optimization | High impact but high regression risk | `next.config.js` + many components | **High** | **Separate phase — owner approval required** |

---

## 6. Phase 1 Test Checklist

### Automated checks (from `package.json` — no invented commands)

**Root (`package.json`):**
- `npm run lint` — Turbo lint all workspaces
- `npm run build` — Turbo build all workspaces

**Web app (`apps/web/package.json`):**
- `npm run lint --workspace=@shop/web` — ESLint
- `npm run build --workspace=@shop/web` — Next.js production build
- `npm run dev --workspace=@shop/web` — local dev server (manual testing)

**Not defined in package.json:** dedicated `typecheck` or `test` script at root or web level.

### Manual checks (after each Phase 1 fix batch)

- [ ] Open `/admin/products` — list loads
- [ ] Pagination next/prev works
- [ ] Search by title returns expected products
- [ ] Search does **not** fire on every keystroke (after debounce fix)
- [ ] Clear filters resets list
- [ ] SKU search works and is debounced
- [ ] Stock filter **in stock** / **out of stock** shows correct products **across pages** (after server fix)
- [ ] Pagination total/count matches filtered results (after server fix)
- [ ] Sort by price / title / createdAt still works
- [ ] Delete, duplicate, publish toggle, featured toggle still work
- [ ] Open `/admin/attributes` — no console spam (after log removal)
- [ ] Public home `/` — SpinWheel still appears after interaction (after lazy load)
- [ ] `/admin/*` — no SpinWheel popup
- [ ] Home, `/products`, PDP still load (regression smoke)
- [ ] **If** image optimization ever approved: visual check ProductCard, Hero, mobile home, PDP images

---

## 7. Explicitly Out Of Scope For Phase 1

Do **not** modify during Phase 1:

- `apps/web/app/(main)/admin/products/add/**`
- Product create / edit / variant / image upload / submit payload
- Prisma schema or migrations
- Checkout, cart business logic, orders, auth, middleware, `proxy.ts`
- Meilisearch fallback, Redis cache infrastructure
- ProductCard unification, public catalog query rewrite (`products-find-*`)
- Deleting dead components from audit
- Implementing image optimization (investigation only in this document)
- Committing or reverting owner's in-progress asset/R2 migration (document only)

Problems found in out-of-scope areas are noted here for awareness only:

- Public catalog still over-fetches in memory (audit Phase 4).
- `minPrice`/`maxPrice` admin filters wired in page/API but not in query-builder or UI.

---

## Summary for Project Owner

### Already done (Phase 1 items)

- **Nothing from the Phase 1 fix list is fully implemented yet.**
- Partial: admin table/formatter refactor (`0a5cab0`); SpinWheel **fetch** gated to home (not admin) — but **not** lazy-loaded.
- Audit remains **accurate** for stock filter, debounce, `SELECT 1`, attributes logs, SpinWheel import, image optimization.

### Not done (requires code changes)

1. Server-side stock filter (+ correct stock aggregation)
2. Search/SKU debounce
3. Remove `$queryRaw SELECT 1`
4. Remove attributes debug log loop
5. SpinWheelPopup dynamic import
6. Image optimization (defer)

### Files likely to change (Phase 1 only)

| Priority | Files |
| -------- | ----- |
| 1 | `apps/web/app/(main)/admin/attributes/useAttributes.ts` |
| 2 | `apps/web/lib/services/admin/admin-products-read/query-executor.ts` |
| 3 | `apps/web/app/(main)/admin/products/page.tsx` |
| 4 | `apps/web/app/api/v1/admin/products/route.ts` |
| 5 | `apps/web/lib/services/admin/admin-products-read/query-builder.ts` |
| 6 | `apps/web/lib/services/admin/admin-products-read/types.ts` |
| 7 | `apps/web/lib/services/admin/admin-products-read/product-formatter.ts` (if stock aggregation fixed) |
| 8 | `apps/web/components/ClientProviders.tsx` |
| Optional | `apps/web/app/(main)/admin/products/hooks/useProductHandlers.ts`, new shared debounce helper |

### Needs owner approval before coding

- Proceed on **clean `main`** vs current dirty worktree (asset migration)
- **Stock filter semantics** (sum all variants vs any variant)
- Whether to include **admin products API log cleanup** in Phase 1
- **SpinWheel lazy load** after runtime test plan agreed
- **Image optimization** — explicitly **not** Phase 1 implementation

### Needs runtime testing

- `npm run lint` / `npm run build` on target branch
- Network behavior for search debounce (before/after)
- Stock filter pagination correctness (after server fix)
- SpinWheel on `/` after dynamic import
- Image URLs vs Next optimizer (future phase)

---

**Confirmation:** No application code was modified during this investigation. Only `PHASE_1_DEBUG_STATUS.md` was created.
