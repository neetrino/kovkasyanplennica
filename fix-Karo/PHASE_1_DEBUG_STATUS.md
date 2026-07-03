# Phase 1 Debug Status — Kovkasyan Plennica

**Date:** 2026-07-01  
**Purpose:** Pre-implementation investigation for Phase 1 (audit follow-up).  
**Rule:** No application code was changed during this investigation.  
**Reference audit:** `AUDIT_KOVKASYANPLENNICA.md`  
**Branch inspected:** `dev-Karo` @ `dad7717`

---

## 0. Current Repo Status

| Check | Result |
| ----- | ------ |
| **Current branch** | `dev-Karo` (up to date with `origin/dev-Karo`) |
| **HEAD commit** | `dad7717` — *Add technical audit docs, R2 asset migration, and menu import tooling* (Karo Gabrielyan, 2026-07-01) |
| **Uncommitted files** | **One:** `PHASE_1_DEBUG_STATUS.md` shows as **deleted** locally (`git status`: `deleted: PHASE_1_DEBUG_STATUS.md`). All other tracked files match HEAD. |
| **Last 10 commits reviewed** | `dad7717` audit + R2 migration · `4358f6d` Merge PR #112 · `cf6cf29` Merge dev-arm · `087edcd` categories ellipsis · `3c22740` ignore tsbuildinfo · `3d69bfd` prefetch · `af6b446` Merge PR #110 · `b984632` single · `b489de6` Merge PR #109 · `a908afa` Merge PR #108 · `0a5cab0` admin |
| **Suspicious / notable recent changes** | **`dad7717` (committed):** removed many local `apps/web/public/**` assets (now R2-only); widened R2 `remotePatterns` pathname in `next.config.js`; `SpinWheelPopup` hero SVGs use `toR2Url()`. **Phase 1 target files are unchanged in `dad7717`:** `admin/products/page.tsx`, `query-executor.ts`, `useAttributes.ts`, `ClientProviders.tsx` — still match audit baseline. **Audit branch note:** original audit ran on `main` @ `4358f6d`; `dev-Karo` is one commit ahead with docs + asset migration only. |

**Action before coding:** Restore or recreate this file; do not start Phase 1 code changes while unrelated local deletes are unstaged unless intentional.

---

## 1. Phase 1 Audit Verification

| Item | Audit Claim | Current Status | Evidence File(s) | Code Evidence | Notes |
| ---- | ----------- | -------------- | ---------------- | ------------- | ----- |
| **Admin products list — stock filter** | Client-side after paginated API fetch | **NOT DONE** | `admin/products/page.tsx`, `ProductFilters.tsx`, `api/v1/admin/products/route.ts`, `admin-products-read/query-builder.ts`, `product-formatter.ts` | `stockFilter` state (page.tsx:33); **not** sent in `params` (page.tsx:132–159); client filter (page.tsx:167–184); API has no `stock` param (route.ts:10–117); `buildProductWhereClause` has no stock logic; `formatProductForList` sets `colorStocks: []` always (product-formatter.ts:72) and `stock` from **one variant only** (query-executor variants `take: 1`) | **Audit still true.** Worse detail: stock filter uses incomplete data. Changing filter **still triggers API refetch** (in `useEffect` deps) but filtering happens client-side — wasted round-trips. Pagination `meta.total` is **wrong** when stock filter ≠ `all`. |
| **Admin products list — search debounce** | Refetch on every filter/search change | **NOT DONE** | `admin/products/page.tsx`, `ProductFilters.tsx`, `useProductHandlers.ts` | `useEffect` deps include `search`, `skuSearch`, `minPrice`, `maxPrice` (page.tsx:127); search `onChange` → `setSearch` (ProductFilters.tsx:65); **no** `useDebounce` / `useDeferredValue` in admin folder; `handleSearch` only `setPage(1)` (useProductHandlers.ts:29–31) | **Confirmed:** every keystroke in title search refetches. SKU field also refetches every keystroke (ProductFilters.tsx:82–85). |
| **Admin products list — `$queryRaw SELECT 1`** | Health check on every list query | **NOT DONE** | `admin-products-read/query-executor.ts` | Lines 107–110: `await db.$queryRaw\`SELECT 1\`` before every `findMany` | Unused for business logic. **Safe Phase 1 removal candidate.** |
| **Debug console.log loops — attributes** | Nested loops in `useAttributes.ts` | **NOT DONE** | `admin/attributes/useAttributes.ts` | Lines 62–78: nested `forEach` logs every attribute value on each fetch | Production noise on `/admin/attributes`. **Safe removal candidate.** |
| **Debug logs — admin products (non-loop)** | Audit focused on attributes; products also noisy | **NOT DONE** | `admin/products/page.tsx`, `api/v1/admin/products/route.ts`, `useProductHandlers.ts` | page.tsx:57,71,110,113,207,260; API route:136,165,172; handlers:79 — timing/info logs, not loops | Lower priority than attributes loop. |
| **SpinWheelPopup lazy loading** | Eager import in `ClientProviders` | **NOT DONE** | `ClientProviders.tsx`, `SpinWheelPopup.tsx` | Static import (ClientProviders.tsx:7); always mounted (line 19); no `next/dynamic` | **Runtime behavior improved:** fetch/popup only on `pathname === '/'`, not admin, after user interaction (SpinWheelPopup.tsx:232–246). **Bundle cost remains:** ~708-line module still parsed on every page. `dad7717` only changed R2 image URLs inside popup. |
| **Image optimization (investigation only)** | Global `unoptimized: true` | **NOT DONE** | `next.config.js`, 30 component files (~45 prop usages) | `next.config.js:98` `unoptimized: true`; R2 + `cdn.neetrino.com` in `remotePatterns`; `dad7717` widened one R2 hostname pathname to `/**` | **Do not implement in Phase 1 without owner approval.** PDP/products pages do not pass `unoptimized` directly; ProductCard/home/mobile do. |

### Audit items — partial progress since audit

| Item | Status | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Admin products table refactor | **PARTIALLY DONE** | Commit `0a5cab0` (2026-06-30) | Removed client-side **stock column sort**; did **not** fix stock **filter** or server-side stock query. |
| Admin product formatter | **PARTIALLY DONE** | `0a5cab0` touched `product-formatter.ts` | Formatting improved; `colorStocks: []` placeholder remains. |
| SpinWheelPopup scope | **PARTIALLY DONE** (behavior, not bundle) | `SpinWheelPopup.tsx:243–246` | Popup logic limited to home route — audit claim “loads on every page” is **partially outdated** for API calls, **still true** for JS bundle/hydration. |
| R2 asset hosting | **DONE** (separate from Phase 1) | Commit `dad7717` | Local public assets removed; `toR2Url()` used widely. Does **not** fix `unoptimized: true`. |

### Outdated audit claims (on `dev-Karo`)

| Audit claim | Current reality |
| ----------- | --------------- |
| “SpinWheelPopup loads on every public page” (API) | **Partially outdated:** API fetch only runs on `/` after interaction; admin excluded. |
| “Audit on main @ 4358f6d” | **Outdated branch pointer:** use `dev-Karo` @ `dad7717` for docs + R2; Phase 1 code paths unchanged. |
| “Phase 1 includes image optimization fix” | **Still listed in audit Phase 1** but this debug pass treats it as **investigation-only** per owner instructions. |

---

## 2. What Is Already Done vs Not Done

| Fix Candidate | Status | Evidence | Needs Code Change? | Risk |
| ------------- | ------ | -------- | ------------------ | ---- |
| Remove attributes debug log loop (`useAttributes.ts:62–78`) | **Not done, safe to fix** | Code present | Yes | **Low** |
| Remove `$queryRaw SELECT 1` | **Not done, safe to fix** | `query-executor.ts:109` | Yes | **Low** |
| Admin title search debounce (~300ms) | **Not done, safe to fix** | No debounce; effect on `search` | Yes — `page.tsx` or shared hook | **Low** |
| Admin SKU search debounce | **Not done, safe to fix** | Same pattern | Yes — same change | **Low** |
| Admin stock filter → server-side | **Not done, needs design** | No API param; incomplete stock in formatter | Yes — page + route + query-builder + formatter | **Medium** |
| Stop refetching API when only client stock filter changes | **Not done, safe partial fix** | `stockFilter` in effect deps but not in API params | Yes — remove from deps OR move filter server-side | **Low** (partial UX fix) |
| Trim admin products / API debug logs | **Not done, safe to fix** | console.log in page + route | Yes — optional | **Low** |
| SpinWheelPopup `next/dynamic` lazy load | **Not done, needs runtime test** | Static import ClientProviders.tsx:7 | Yes | **Low–Medium** |
| Image optimization re-enable | **Not done, defer** | `next.config.js:98` | Yes — config + many files | **High** — owner approval + runtime tests |
| Admin price min/max filter | **NOT DONE / broken** | State + API support exist; no UI; query-builder ignores price | Out of Phase 1 unless expanded | Medium |

**Git history:** No commit on `dev-Karo` or recent `main` removes `SELECT 1`, adds debounce, implements server stock filter, or lazy-loads SpinWheel. Relevant: `0a5cab0` admin refactor; `3d69bfd` ProductCard prefetch; `5f27f75` global unoptimized + R2; `dad7717` asset migration only.

---

## 3. Current Flow Explanations

### Admin Products List Flow

1. **Entry:** `apps/web/app/(main)/admin/products/page.tsx` (`'use client'`).
2. **Auth guard:** `useEffect` redirects non-admin to `/admin` (lines 44–51).
3. **State:** filters (`search`, `skuSearch`, `selectedCategories`, `stockFilter`, `minPrice`, `maxPrice`, `sortBy`), pagination (`page`, `meta`), table (`products`, `selectedIds`), `currency`.
4. **Categories (once):** `fetchCategories()` → `GET /api/v1/admin/categories`.
5. **Products fetch trigger:** `useEffect` (122–127) when auth ready **or** when `page`, `search`, `selectedCategories`, `skuSearch`, **`stockFilter`**, `sortBy`, `minPrice`, `maxPrice` change.
6. **Params built:** `page`, `limit: 20`, optional `search`, `category`, `sku`, `minPrice`, `maxPrice`, `sort` (createdAt sorts only). **`stockFilter` omitted.**
7. **HTTP:** `apiClient.get('/api/v1/admin/products', { params })`.
8. **API route:** `apps/web/app/api/v1/admin/products/route.ts` → auth → `validateAndNormalizeFilters` → `adminService.getProducts`.
9. **Service:** `admin-products-read/product-operations.ts` → `buildProductWhereClause` + `buildProductOrderByClause` → `executeProductListQuery`.
10. **DB:** `$queryRaw SELECT 1` → `product.findMany` (skip/take, includes translations/variants/labels/categories) → `product.count` (10s timeout fallback).
11. **Response:** `{ data: Product[], meta: { total, page, limit, totalPages } }`.
12. **Client post-process:** Filter `data` by `stockFilter` in memory (167–184). **`meta` not adjusted.**
13. **Client sort:** `sortedProducts` useMemo sorts `price` / `title` locally; `createdAt` uses server order.
14. **Render:** `ProductsTable` → pagination uses **unfiltered** `meta`.

### Admin Search Flow

1. User types in **title search** input → `setSearch(value)` on every `onChange` (ProductFilters.tsx:65).
2. `search` state updates → `useEffect` runs → `fetchProducts()` immediately.
3. **No debounce.** Pressing Enter calls `handleSearch` → `setPage(1)` only; fetch already happened on last keystroke.
4. **SKU field:** same immediate refetch pattern + `setPage(1)` on each change.
5. **Clear filters:** `handleClearFilters` resets search/SKU/categories/stock/page — triggers new fetch via effect.
6. **Pagination:** `setPage` in table; changing page refetches with current filters.

### Admin Stock Filter Flow

1. User selects stock dropdown → `setStockFilter` + `setPage(1)` (ProductFilters.tsx:167–170).
2. **`useEffect` runs** because `stockFilter` is a dependency → **full API refetch** (unnecessary if filter stays client-side).
3. API returns page of 20 products **without stock filtering**.
4. Client filters array by summing `colorStocks` (always empty) or `stock` from formatter (single cheapest variant).
5. **Pagination bug:** `meta.total` / `totalPages` reflect all products matching search/category, **not** stock filter → user may see empty pages or wrong page count.
6. **Data bug:** products with stock on non-cheapest variant may appear “out of stock”.

### SpinWheelPopup Flow

1. **Import:** `ClientProviders.tsx` statically imports and renders `<SpinWheelPopup />` for **all routes** (including admin chrome-hidden routes).
2. **Mount:** Component always mounts; hooks run (`usePathname`, `useAuth`, interaction listeners).
3. **Interaction gate:** Waits for first `pointerdown` / `keydown` / `scroll` (`hasInteracted`).
4. **Route gate:** Skips if admin, not on `/`, dismissed cooldown active, or auth loading.
5. **Fetch:** After 3.5s delay, `GET /api/v1/spin-wheel/active-prizes` **only on home `/`**.
6. **Render:** Returns `null` until `open && !loading && visiblePrizes.length` (line 357–358) — no DOM when closed, but JS already loaded.
7. **Lazy load opportunity:** `next/dynamic(() => import('./SpinWheelPopup'), { ssr: false })` would defer parsing until after first paint or interaction.

---

## 4. Unknowns / Questions Before Coding

| Question | Why It Matters | How To Verify | Status |
| -------- | -------------- | ------------- | ------ |
| Does title search fire a network request on **every** keystroke? | Debounce priority | Code confirms `useEffect` on `search` — **yes from code** | **Answered (code)** |
| Does stock filter break pagination totals? | Server-side filter design | Code: client filter + unmodified `meta` — **yes from code** | **Answered (code)** |
| Is `SELECT 1` only a health check? | Safe to remove | Code: result unused; followed by `findMany` — **yes** | **Answered (code)** |
| What stock value should “in stock” use — sum all variants or cheapest only? | Server filter correctness | Product formatter + query include only 1 variant | **Needs owner decision** |
| Can `SpinWheelPopup` lazy-load without missing the 3.5s home popup? | Lazy-load timing | Load dynamic import on first interaction or idle | **NEEDS RUNTIME TESTING** |
| Are R2/CDN image URLs compatible with Next Image optimization if re-enabled? | Image Phase risk | Enable in dev; test home, ProductCard, PDP | **NEEDS RUNTIME TESTING** |
| Are Phase 1 files modified locally? | Safe to branch | `git status` — only deleted debug doc | **Answered: clean except doc delete** |
| Do lint/build pass on `dev-Karo`? | Pre-merge gate | Run `npm run lint`, `npm run build` | **NEEDS RUNTIME TESTING** (not run in this investigation) |
| Should stock filter refetch API at all? | Quick win vs full fix | Remove `stockFilter` from effect deps until server filter exists | **Needs owner approval** |

---

## 5. Recommended Safe Fix Order

| Order | Fix | Why This Order | Files | Risk | Test |
| ----- | --- | -------------- | ----- | ---- | ---- |
| 1 | Remove nested debug loop in `useAttributes.ts` | Zero behavior change; instant UX win on attributes page | `admin/attributes/useAttributes.ts` | **Low** | Open `/admin/attributes`; confirm list loads; console clean |
| 2 | Remove `$queryRaw SELECT 1` | One extra DB round-trip per admin list; no logic dependency | `admin-products-read/query-executor.ts` | **Low** | `/admin/products` list + pagination |
| 3 | Debounce title + SKU search (300ms) | Stops request storm; no API contract change | `admin/products/page.tsx` (or new `useDebouncedValue` hook in `lib/`) | **Low** | Type quickly in search; Network tab shows fewer requests |
| 4 | Remove `stockFilter` from fetch `useEffect` deps until server filter exists | Stops useless refetches; partial perf fix | `admin/products/page.tsx` | **Low** | Change stock filter; list filters without new network call |
| 5 | Server-side stock filter (after owner defines stock rules) | Fixes pagination correctness | `page.tsx`, `route.ts`, `query-builder.ts`, `product-formatter.ts`, possibly `query-executor.ts` | **Medium** | Filter in/out of stock; verify counts and pages |
| 6 | Trim noisy `console.log` in admin products page + API route | Cleaner logs | `page.tsx`, `route.ts` | **Low** | Smoke test admin products |
| 7 | Lazy-load `SpinWheelPopup` via `next/dynamic` | Bundle size; preserve home-only fetch logic | `ClientProviders.tsx` | **Low–Medium** | Home `/` popup after interaction; admin/other routes unaffected |
| 8 | Image optimization | **Separate approved phase** — not Phase 1 implementation | `next.config.js` + ~30 components | **High** | Full visual regression on R2 URLs |

---

## 6. Phase 1 Test Checklist

### Automated checks (from `package.json`)

**Root (`shop-classic`):**

| Script | Command |
| ------ | ------- |
| Lint (all workspaces) | `npm run lint` |
| Build (turbo) | `npm run build` |
| Dev | `npm run dev` |

**`apps/web` (`@shop/web`):**

| Script | Command |
| ------ | ------- |
| Lint | `npm run lint --workspace=@shop/web` |
| Build | `npm run build --workspace=@shop/web` |
| Dev | `npm run dev --workspace=@shop/web` |

**Not defined in repo:** no root `test`, `typecheck`, or `vitest` script found.

*Status: commands listed from package.json only — **not executed** in this investigation.*

### Manual checks

- [ ] Open `/admin/products` as admin — list loads
- [ ] Pagination next/prev works
- [ ] Title search returns expected products
- [ ] **Network tab:** typing search does **not** fire request per keystroke (after debounce fix)
- [ ] Clear filters resets list
- [ ] Stock filter “in stock” / “out of stock” shows sensible rows
- [ ] **Stock filter + pagination:** total pages match filtered set (after server fix)
- [ ] Sort by price / title / createdAt works
- [ ] Delete / duplicate / publish toggle still work
- [ ] Open `/admin/attributes` — no console spam from color debug loop (after log fix)
- [ ] Public home `/` — page loads
- [ ] Spin wheel popup appears after interaction (~3.5s) when prizes configured
- [ ] `/products`, PDP — images load from R2
- [ ] Admin routes — no spin wheel overlay

---

## 7. Explicitly Out Of Scope For Phase 1

Do **not** modify during Phase 1 implementation:

- `apps/web/app/(main)/admin/products/add/**` (create/edit form)
- Product create / edit / variant / image upload / submit payload
- Prisma schema or migrations
- Checkout, cart business logic, orders
- Auth, middleware, `proxy.ts`
- Meilisearch fallback, Redis cache infrastructure
- ProductCard unification
- Public catalog over-fetch rewrite (`products-find-query/*`)
- Deleting unused components from audit
- Re-enabling image optimization **without explicit owner approval**

Problems found in out-of-scope areas should be **documented only**.

---

## 8. Files That Would Need Changes (When Approved)

| Priority | File | Change |
| -------- | ---- | ------ |
| 1 | `apps/web/app/(main)/admin/attributes/useAttributes.ts` | Remove debug loop (lines 61–78) |
| 2 | `apps/web/lib/services/admin/admin-products-read/query-executor.ts` | Remove `$queryRaw SELECT 1` (lines 107–110) |
| 3 | `apps/web/app/(main)/admin/products/page.tsx` | Debounced search state; optional `stockFilter` effect fix; optional log cleanup |
| 4 | `apps/web/app/api/v1/admin/products/route.ts` | Add `stock` query param (if server filter approved) |
| 5 | `apps/web/lib/services/admin/admin-products-read/query-builder.ts` | Stock WHERE clause (if approved) |
| 6 | `apps/web/lib/services/admin/admin-products-read/product-formatter.ts` | Accurate stock aggregation (if approved) |
| 7 | `apps/web/components/ClientProviders.tsx` | `next/dynamic` for SpinWheelPopup (if approved) |
| — | `apps/web/next.config.js` + ~30 components | Image optimization — **deferred** |

**Optional new file:** `apps/web/lib/hooks/useDebouncedValue.ts` (if no existing shared debounce utility — confirmed none in admin today).

---

## 9. Owner Approval Required Before Coding

| Item | Reason |
| ---- | ------ |
| **Server-side stock filter** | Needs rule: sum all variant stock vs published variants only vs `colorStocks` |
| **Image optimization** | Explicitly investigation-only; high regression risk on R2 URLs |
| **SpinWheelPopup lazy load** | Needs runtime confirmation popup timing unchanged |
| **Mixing with `dad7717` asset migration** | Ensure Phase 1 PR is reviewable separately from R2/menu import |
| **Removing admin API `console.log` timing** | May be used informally for perf debugging — confirm before delete |

---

## 10. Summary

### Already done (Phase 1 scope)

- **Nothing fully complete** for the seven investigated Phase 1 fix items.
- **Partial:** admin table refactor (`0a5cab0`); SpinWheel **fetch** scoped to home only; R2 asset migration (`dad7717`) — unrelated to admin list perf.

### Not done

- Client-side stock filter with wrong pagination/stock data
- Search/SKU debounce
- `$queryRaw SELECT 1` removal
- Attributes debug log loop removal
- SpinWheelPopup code-splitting
- Image optimization

### Needs runtime testing

- `npm run lint` / `npm run build` on `dev-Karo`
- SpinWheel lazy-load timing
- Image optimization compatibility (future phase)

---

**Confirmation: No application code was modified during this investigation.** Only `PHASE_1_DEBUG_STATUS.md` was created/recreated.
