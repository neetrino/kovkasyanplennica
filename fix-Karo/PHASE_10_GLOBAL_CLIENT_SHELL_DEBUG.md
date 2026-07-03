# Phase 10 Global Client Shell Debug

**Date:** 2026-07-02  
**Branch:** `dev-Karo`  
**Phase type:** DEBUG / AUDIT ONLY — no production code changes  
**Scope:** Global shared client JS baseline — `ClientProviders`, `MainSiteChrome`, Header, Footer, auth/cart/toast/prefetch, mobile chrome — after Phase 9 bundle analyzer + catalog server-shell wiring

---

## Git state

| Item | Value |
|------|-------|
| **Branch** | `dev-Karo` |
| **Tracking** | Up to date with `origin/dev-Karo` |
| **Latest commits** | `e3c29ef` perf(products): add bundle analyzer and wire catalog server shells · `014168d` perf(products): server-first catalog cards with client islands · `c74c76d` perf(products): reduce shop SSR payload with lazy rows · `56b56ed` perf(products): trim shop page payload and cache tags |
| **Phase 9 completed** | **Yes (committed + pushed)** — `e3c29ef` on `origin/dev-Karo` |
| **Local debug/test files** | Pre-existing untracked debug markdown + Phase 5D scripts; modified `PHASE_1_DEBUG_STATUS.md` |
| **Production code changed** | **no** (audit only) |

---

## Prior reports confirmed

| Finding | Still true after Phase 9 |
|---------|--------------------------|
| Phase 9 configured `@next/bundle-analyzer` + `build:analyze` | **Yes** |
| Phase 9 inspected `/products` route chunks | **Yes** — analyzer treemap at `apps/web/.next/analyze/client.html` |
| Phase 9 wired `CatalogProductCardShell` into `ProductsCategoryRow` | **Yes** — server shells passed as `children` to expand controls |
| Large shared/root client baseline dominates non-catalog routes | **Yes** — ~970 KB parsed shared JS before route chunks |
| Phase 10 should focus on global shell, not products API or ProductCard | **Yes** |
| Pre-existing admin TS error may block full typecheck | **Yes** — still present (see below) |
| Pre-existing Footer hydration warning may exist | **Likely** — Footer is client solely for `useTranslation` + `usePathname`; i18n hook reads localStorage after mount |

---

## Analyzer / build status

| Check | Result |
|-------|--------|
| **`@next/bundle-analyzer` installed** | **Yes** — `^16.2.10` in `apps/web/package.json` devDependencies |
| **`ANALYZE=true` supported** | **Yes** — `next.config.js` wraps config with `withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })` |
| **`build:analyze` script** | **Yes** — `next build --webpack --experimental-build-mode=compile` |
| **Phase 9 added analyzer correctly** | **Yes** |
| **Analyzer output paths** | `apps/web/.next/analyze/client.html`, `nodejs.html`, `edge.html` |
| **Route-level First Load JS table** | **Not available** — compile-only build mode; treemap uses webpack stats, not finalized Next route sizes |
| **Normal build (`npm run build`)** | **Pass** (compile mode, Turbopack) |
| **Analyzer build (`ANALYZE=true npm run build:analyze`)** | **Pass** (webpack compile mode) |
| **Prisma EPERM** | **Yes** — `query_engine-windows.dll.node` locked; prebuild used existing client; builds still succeed |
| **Full `tsc --noEmit`** | **Fail** — pre-existing errors: `useProductFormHandlers.ts:376` (admin product form payload type), `LazyCategoryProductsSection.tsx:136` (lang type), `query-executor.ts` (Prisma include types). **Do not fix in Phase 10 debug.** |

---

## Shared bundle baseline

Webpack analyzer + chunk listing (post Phase 9, webpack analyze build):

| Chunk / group | Parsed size | Gzip (analyzer) | Symbols / modules | Notes |
|---------------|------------:|----------------:|-------------------|-------|
| `1968-*.js` | **222 KB** | 61 KB | `Footer`, Next/router/vendor | Largest shared chunk |
| `87c73c54-*.js` | **200 KB** | 63 KB | React DOM / shared vendor | Second-largest shared |
| `framework-*.js` | **190 KB** | 60 KB | React 19 runtime | Framework baseline |
| `5298-*.js` | **135 KB** | 34 KB | `wishlist` route strings, `spinWheel`, i18n-adjacent | Shared app chunk |
| `main-*.js` | **132 KB** | 38 KB | Next client bootstrap | Entry |
| `polyfills-*.js` | **110 KB** | — | Polyfills | Always loaded |
| `app/(main)/layout-*.js` | **43 KB** | 12 KB | **Global shell** — see breakdown below | Loads on every `(main)` route |
| `734-*.js` | **51 KB** | 20 KB | Shared lazy chunk (Header-adjacent) | Pulled with layout graph |
| **Approx shared first-load total** | **~970 KB parsed** | **~268 KB gzip** | Before route-specific chunks | Dominated by framework + two large vendor chunks + layout shell |

### `(main)/layout` chunk module breakdown (analyzer)

| Module | Parsed | Gzip | Notes |
|--------|-------:|-----:|-------|
| `MainSiteChrome` + 8 concatenated modules | 35.1 KB | 9.2 KB | Entire site chrome boundary |
| → `Header.tsx` | 9.0 KB | 2.3 KB | Desktop header — largest shell module |
| → `Footer.tsx` | 8.4 KB | 2.2 KB | Desktop footer |
| → `HeaderSearchOverlay.tsx` | 5.5 KB | 1.4 KB | **Eager** import from Header + MobileBottomNav |
| → `MobileHeader.tsx` | 4.1 KB | 1.1 KB | Mobile top bar |
| → `MobileBottomNav.tsx` | 3.2 KB | 0.8 KB | Mobile bottom nav + search |
| → `MobileBottomNavIcons.tsx` | 2.8 KB | 0.7 KB | SVG icon components |
| `Toast.tsx` | 2.9 KB | 1.1 KB | Global toast container |
| `ClientProviders.tsx` | 0.4 KB | 0.3 KB | Thin wrapper (Auth imported via graph) |
| `AuthContext.tsx` | 5.4 KB | 1.9 KB | Duplicated into several route chunks when auth used |

### Phase 9 impact on `/products`-adjacent chunks

| Check | Before Phase 9 (Phase 9 debug) | After Phase 9 |
|-------|-------------------------------|---------------|
| `CatalogProductCardShell` wired | **No** — dead code | **Yes** — `ProductsCategoryRow` maps server shells |
| `ProductCard` in `/products` page chunk | Not in products expand chunk | **Still not** in `products/page-*.js` (35 KB chunk) — legacy card remains in home/PDP chunks only |
| `/products` HTML size | ~223 KB | **~218 KB** (slight improvement) |
| Shared baseline | ~569 KB (Turbopack rootMain estimate) | **~970 KB parsed** (webpack analyze — different bundler; not apples-to-apples, but confirms large global cost) |

---

## Global layout architecture

### Layout files

| File | Role |
|------|------|
| `app/layout.tsx` | **Server** — root HTML, Inter font, metadata only |
| `app/(main)/layout.tsx` | **Server** — wraps all public pages in `ClientProviders` → `MainSiteChrome` |
| `app/(main)/admin/layout.tsx` | Admin-specific (still under `(main)` layout — chrome hidden via pathname check) |

### Global shell components (every `(main)` route except admin chrome hidden)

```
app/(main)/layout.tsx (server)
└─ Suspense
   └─ ClientProviders ('use client')
      ├─ AuthProvider (global)
      ├─ CoreRoutePrefetch (no-op stub)
      ├─ ToastContainer (global, event-driven)
      ├─ SpinWheelPopup (dynamic, ssr:false, pathname === '/' only)
      └─ MainSiteChrome ('use client')
         ├─ Header (desktop, xl+, fixed)
         ├─ MobileHeader (mobile, xl:hidden)
         ├─ {children} (route content — may be server or client)
         ├─ Footer (desktop, lg+, hidden on mobile)
         └─ MobileBottomNav (mobile, lg:hidden)
```

### Providers

| Provider / hook | Mounted globally? | What it imports / does |
|-----------------|-------------------|------------------------|
| `AuthProvider` | **Yes** — all `(main)` routes | `apiClient`, JWT localStorage, router, role checks; fetches/validates on mount |
| `CoreRoutePrefetch` | **Yes** — returns `null` | **Disabled** — no prefetch cost |
| `ToastContainer` | **Yes** | Custom event `show-toast`; ~2.9 KB parsed |
| `SpinWheelPopup` | **Home only** (`pathname === '/'`) | Already `dynamic(..., { ssr: false })` |
| Cart context provider | **No** | Cart via `fetchCart` in Header / MobileBottomNav |
| Wishlist/compare provider | **No** | localStorage on dedicated pages only |
| Currency provider | **No** | `useCurrency` hook + window events |

### Client boundaries

| Component | Server-feasible? | Why client today |
|-----------|------------------|------------------|
| `ClientProviders` | Partial | `usePathname` for SpinWheel; wraps Auth + Toast |
| `MainSiteChrome` | Partial | `usePathname` for admin hide + scroll region id |
| `Header` | **Partial — high value split** | Cart fetch, auth menu, search overlay, home scroll-surface detection, ResizeObserver, currency events |
| `Footer` | **Yes — strong candidate** | Only `useTranslation` + `usePathname` for menu-page bg color |
| `MobileHeader` | Partial | Auth, mobile drawer menu state |
| `MobileBottomNav` | Partial | Cart count fetch, search overlay, auth |
| `HeaderSearchOverlay` | Must stay client | Portal, Meilisearch API, debounce — but can be **lazy** |

---

## Header findings

### Why client?

`Header.tsx` is `'use client'` because it uses:

- `usePathname`, `useAuth`, `useTranslation`
- `useState` / `useEffect` for cart total, currency, user menu, search open state, home header surface
- `fetchCart` on mount + `cart-updated` / `currency-updated` / `auth-updated` listeners
- `ResizeObserver` + scroll sync CSS vars for fixed header width
- Home-only scroll listener for cream/dark header surface (`data-home-header-surface` sections)
- Synchronous import of `HeaderSearchOverlay`

### Heavy imports

| Import | Loaded at first paint? | Needed globally? |
|--------|------------------------|------------------|
| `HeaderSearchOverlay` | **Yes** | **No** — only when search opens |
| `fetchCart` / cart types | Yes | Yes for cart badge (desktop) |
| `useAuth` | Yes | Yes for login/profile/admin links |
| `formatPrice` / `getStoredCurrency` | Yes | Yes for cart total display |
| `next/image` logo | Yes | Could be server markup |

### Static vs interactive

| Part | Static (server candidate) | Interactive (client island) |
|------|---------------------------|----------------------------|
| Logo + nav links | **Yes** — links from `HEADER_NAV_ITEMS` | Active state needs pathname |
| Center navigation | **Yes** with server pathname | Minor |
| Search button shell | **Yes** | Opens overlay |
| Search overlay | — | **Client, lazy-loadable** |
| Cart badge + price | — | **Client island** (fetch + currency) |
| Login / profile dropdown | — | **Client island** (auth) |
| Home cream/dark surface | — | **Client only on `/`** |

### Safe action for Phase 10

1. **Lazy-load `HeaderSearchOverlay`** via `dynamic(..., { ssr: false })` — load on first search open, not at layout parse time.
2. **Do not** full Header server rewrite in Phase 10 — home scroll-surface + cart/auth coupling is medium-risk.
3. Optional follow-up (Phase 11): server Header shell + `HeaderCartBadgeIsland` + `HeaderAuthIsland`.

---

## Footer findings

### Why client?

`Footer.tsx` is `'use client'` for:

- `useTranslation()` — reads language from localStorage **after mount** (defaults to `'ru'` on server/first paint)
- `usePathname()` — `isMenuPage` toggles cream vs dark background on `/menu` only

No `useState`, no cart/wishlist, no fetch, no window listeners in Footer itself.

### Hydration warning cause

**Likely source:** `useTranslation` in `lib/i18n-client.ts` initializes `lang` as `'ru'`, then `useEffect` reads `getStoredLanguage()` from localStorage. If stored language differs, Footer link text / headings can mismatch between SSR HTML and first client render → React hydration warning.

Secondary: Footer uses raw `<img>` for decorative pattern while logo uses `next/image` — unlikely primary cause but inconsistent.

**Not caused by:** `Date`, `Math.random`, or dynamic copyright year (hardcoded `2026`).

### Server-feasible?

**Yes.** Footer content is almost entirely static links, translated strings, and images. Language can come from server cookie/header (default `'ru'`). Menu-page background can use a server prop from pathname segment or a CSS class on `<body>` / layout.

### Safe action

Convert `Footer` to a **Server Component** with server-side `t(lang, path)` (existing `lib/i18n` server path) and pass `isMenuPage` from layout or derive from segment. Removes ~8.4 KB parsed from layout hydration and fixes i18n mismatch.

---

## Provider findings

| Provider / hook | Mounted globally | What it imports | Can lazy/move? | Risk |
|-----------------|------------------|-----------------|----------------|------|
| `AuthProvider` | Yes | `apiClient`, JWT, router | Lazy init possible but **not recommended** — breaks login-gated UI on first paint | **High** if removed from global |
| `ToastContainer` | Yes | Minimal custom toast | Could dynamic-load on first `show-toast` event | **Low** — small win (~2.9 KB) |
| `CoreRoutePrefetch` | Yes (stub) | Nothing | Already no-op | None |
| `SpinWheelPopup` | Home only | Auth, localStorage | Already lazy | Done |
| `useCurrency` | Per-component | Window events | Not global — OK | — |
| Cart (`fetchCart`) | Header + MobileBottomNav | API client | Move to cart badge island only | Medium |

**Conclusion:** Only `AuthProvider` truly must stay global for current architecture. Toast is optional lazy trim. No wishlist/compare/cart **providers** exist globally.

---

## Global leakage findings

| Area | Leaks into all pages? | Evidence |
|------|----------------------|----------|
| **wishlist/compare logic** | **No functional leak** | No global provider; wishlist/compare pages are standalone client pages. String `wishlist` appears in shared chunk `5298` (route labels / prefetch graph), not full page modules. Legacy `components/MobileBottomNav.tsx` (with wishlist/compare counts) is **unused** — active nav is `mobileHomePage/MobileBottomNav.tsx`. |
| **cart** | **Yes — by design** | Header + MobileBottomNav fetch cart on mount on every page |
| **ProductCard** | **No on `/products`** | Only in route chunks for home/PDP (`products/page` chunk has catalog components, not legacy `ProductCard`) |
| **search/mobile menu** | **Partial** | `HeaderSearchOverlay` bundled eagerly in layout chunk; mobile drawer menu is inline in `MobileHeader` (not lazy) |
| **toast** | **Yes** | `ToastContainer` in `ClientProviders` on every route (~2.9 KB) |
| **prefetch** | **No** | `CoreRoutePrefetch` disabled |

### Biggest avoidable global cost

1. **`HeaderSearchOverlay` eager import** (~5.5 KB parsed + API client deps) in layout-bound Header and MobileBottomNav  
2. **`Footer` full client hydration** (~8.4 KB parsed) for translation/pathname only  
3. **`Header` cart + home-surface effects** on every page (harder to trim without island split)

---

## Route size baseline

**Environment:** Local dev, `http://localhost:3000`, post Phase 9

| URL | Run 1 | Run 2 | Size (RawContentLength) | Notes |
|-----|-------|-------|-------------------------|-------|
| `/` | 2042 ms | 576 ms | **208,282 B** | Home; global shell + menu sections |
| `/products` | 940 ms | 833 ms | **218,292 B** | ~5 KB smaller vs Phase 9 debug (~223 KB) |
| `/products?category=sousy` | 693 ms | 673 ms | **168,121 B** | Filtered — smaller payload |
| `/products/matsun-sousy` | 3405 ms | 535 ms | **140,427 B** | PDP cold compile on run 1 |
| `/cart` | 150 ms | 147 ms | **54,557 B** | Small HTML; **same global JS baseline** |
| `/wishlist` | 152 ms | 152 ms | **47,127 B** | Tiny HTML; global JS still loads |
| `/compare` | 158 ms | 151 ms | **47,176 B** | Same pattern |

**Interpretation:** Cart/wishlist/compare HTML is small (~47–55 KB), but every route still pays the **~970 KB parsed shared JS** + **43 KB layout shell**. Global shell dominates small pages. `/products` HTML improved slightly after Phase 9 server shells; remaining catalog cost is route chunk + per-card islands, not global shell.

---

## Recommended Phase 10 implementation

**Choose ONE combined plan:** **Option A + D — Server Footer + lazy search overlay (global shell trim)**

Smallest measurable win that reduces shared layout JS and fixes hydration **without** risking auth/cart behavior. Does not attempt full Header server rewrite.

### Goal

1. Remove unnecessary client hydration from `Footer` (translation + pathname only).  
2. Stop loading `HeaderSearchOverlay` on every page first paint — load only when user opens search (desktop Header + mobile bottom nav).  
3. Keep `AuthProvider`, cart badge fetch, and Header home-surface logic unchanged.

### Exact approach

1. **Convert `Footer` to Server Component**
   - Remove `'use client'`.
   - Read language server-side (cookie / `Accept-Language` / default `'ru'`) using existing `lib/i18n` + `lib/language`.
   - Pass `isMenuPage` from server (check segment or prop from layout).
   - Use server `t(lang, key)` for all footer strings.
   - Adjust `MainSiteChrome` so Footer can render as server child (split chrome: server footer slot outside client boundary, or refactor `MainSiteChrome` into server wrapper + client header/nav only).

2. **Lazy-load `HeaderSearchOverlay`**
   - In `Header.tsx` and `mobileHomePage/MobileBottomNav.tsx`, replace static import with:
     ```tsx
     const HeaderSearchOverlay = dynamic(
       () => import('../HeaderSearchOverlay').then(m => m.HeaderSearchOverlay),
       { ssr: false, loading: () => null }
     );
     ```
   - Render overlay only when `isSearchOpen === true` (already gated by `open` prop — ensure chunk loads on first open).

3. **Optional small win (only if zero risk in QA):** dynamic `ToastContainer` on first `show-toast` — defer unless analyzer shows clear benefit.

4. **Do not** touch: `AuthProvider`, cart fetch in Header, products API, ProductCard, admin TS errors, Phase 5D scripts, debug markdown.

### Files expected

| File | Change |
|------|--------|
| `apps/web/components/Footer.tsx` | Server component conversion |
| `apps/web/components/MainSiteChrome.tsx` | Restructure to allow server Footer (client header/nav wrapper) |
| `apps/web/app/(main)/layout.tsx` | Possibly compose server Footer + client chrome |
| `apps/web/components/Header.tsx` | Dynamic import for search overlay |
| `apps/web/components/mobileHomePage/MobileBottomNav.tsx` | Dynamic import for search overlay |
| `apps/web/lib/language.ts` or small server helper | Read lang for Footer SSR (if not already exported for server) |

### Success metric

| Metric | Target |
|--------|--------|
| `(main)/layout` parsed JS (analyzer) | **≥ 10 KB reduction** (Footer ~8.4 KB + SearchOverlay ~5.5 KB minus dynamic stub overhead) |
| Footer hydration warning | **Gone** in dev console on `/`, `/products`, `/menu` |
| Search UX | Opens overlay within one interaction; no regression on mobile/desktop |
| Cart badge / auth header | Unchanged behavior |
| `/products` RawContentLength | No regression above ~220 KB |
| `/cart`, `/wishlist`, `/compare` | Smoke OK |

### Tests

1. `ANALYZE=true npm run build:analyze --workspace=@shop/web` — compare `(main)/layout` chunk size before/after.
2. DevTools console — no Footer hydration mismatch on home, products, menu.
3. Desktop — click search, type query, navigate to PDP from results.
4. Mobile — bottom nav search opens overlay; cart count still updates.
5. `/cart`, `/wishlist`, `/compare`, `/products`, PDP — smoke.
6. Logged-in + logged-out header/footer — auth links correct.

### Stop conditions

1. Server Footer split breaks `MainSiteChrome` scroll layout or admin chrome hide.
2. Lazy search overlay causes visible delay or fails to open on first click.
3. Measured layout chunk reduction < 5 KB parsed — stop before Toast lazy or Header rewrite.
4. Cart/auth regression on any core route.

### Commit message

```
perf(shell): server footer and lazy header search overlay
```

### Risk level

**Low–Medium** — Footer server conversion needs careful MainSiteChrome boundary refactor; search lazy-load is low risk.

---

## Postponed items (do NOT do in Phase 10)

| Item | Reason |
|------|--------|
| Full Header server shell + cart/auth islands | Medium–high risk; defer to Phase 11 if needed |
| Split `AuthProvider` / remove from global | Breaks auth-gated UI sitewide |
| Global `ProductCard` refactor (home/PDP/mobile) | Out of scope — large blast radius |
| Remove legacy unused `components/MobileBottomNav.tsx` | Cleanup only; no measured perf until imported paths verified |
| DB/API/query changes | Completed in Phases 5–7 |
| Admin TS fixes (unless blocking build) | Pre-existing; separate task |
| Toast lazy-load | Optional; only if primary metrics met early |
| Commit debug markdown or Phase 5D scripts | Local-only artifacts |

---

## Final recommendation

| Question | Answer |
|----------|--------|
| **Phase 10 safe to implement?** | **Yes** — evidence supports targeted global shell trim |
| **Biggest win without cart/auth risk** | Server Footer + lazy HeaderSearchOverlay |
| **Should Phase 10 be the final planned performance phase?** | **Yes, if implementation succeeds** — remaining wins (Header server islands, home ProductCard split) are larger refactors with diminishing returns after shell trim |
| **Is Phase 11 justified?** | **Only if** post-Phase 10 analyzer shows Header/cart island split still > 15 KB gzip on shared baseline **and** product metrics are already acceptable |

**One-sentence recommendation:** Phase 10 should convert `Footer` to a server component (fixing i18n hydration) and lazy-load `HeaderSearchOverlay` in Header and mobile bottom nav, leaving auth/cart Header logic untouched — the lowest-risk measurable reduction of the global client shell after Phase 9 catalog work.
