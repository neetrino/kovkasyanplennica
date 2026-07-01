# Kovkasyan Plennica Technical Audit

**Repository:** [neetrino/kovkasyanplennica](https://github.com/neetrino/kovkasyanplennica)  
**Audit date:** 2026-07-01  
**Scope:** Read-only static + git history analysis. No code was changed during this audit.  
**Branch inspected:** `main` @ `4358f6d`

---

## 1. Executive Summary

Kovkasyan Plennica is a **Next.js 16 monorepo e-commerce / restaurant menu platform** (Turbo workspaces: `apps/web`, `packages/db`, `packages/ui`, `packages/design-tokens`) backed by **PostgreSQL (Prisma)**, **Redis/Upstash caching**, and **Meilisearch** for product search.

The storefront has a **reasonably unified ProductCard system** for listing surfaces (home menu, products carousel, related products), but **parallel product UI implementations** exist on mobile new-arrivals, wishlist, compare, cart, search overlay, and all admin surfaces. These are maintainability and consistency risks, not all performance blockers.

The **largest confirmed performance problems** are:

1. **Global image optimization disabled** (`images.unoptimized: true` in `next.config.js`) plus widespread per-component `unoptimized` props — every image bypasses Next.js optimization.
2. **Catalog query over-fetch + in-memory filtering** — product list API can load up to **4,000 full product graphs** (variants, attributes, translations) then filter/sort/paginate in Node memory.
3. **Filter facets API loads entire product catalogs** with deep Prisma includes (`products-filters.service.ts`).
4. **Admin panel is almost entirely client-rendered** with duplicated auth guards, client-side sorting/filtering, and a **5,000+ line add/edit product form** spread across dozens of hooks.
5. **Global client bundle weight** — `ClientProviders` mounts `AuthProvider`, `CoreRoutePrefetch`, `ToastContainer`, and a **708-line `SpinWheelPopup`** on every public page; `MainSiteChrome` always hydrates Header/Footer/Mobile nav (467-line Header).

Caching (Redis + `unstable_cache` + ISR `revalidate=3600`) is present and partially effective, but **cache invalidation and query shape undermine gains** when filters/search are used.

**Recommendation:** Proceed in phases — fix image/query bottlenecks first (low UX risk), then unify ProductCard variants, then refactor admin data layer and form architecture. Do not delete dead code until import verification in CI.

---

## 2. Project Architecture

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16.2.9, React 19, Tailwind CSS |
| Backend | Next.js Route Handlers (`apps/web/app/api/v1/**`) |
| Database | PostgreSQL via Prisma (`packages/db`) |
| Cache | Upstash Redis + in-process memory fallback (`with-redis-cache.ts`) |
| Search | Meilisearch (with DB fallback) |
| Assets | Cloudflare R2 (`toR2Url`, `@aws-sdk/client-s3`) |
| Monorepo | npm workspaces + Turbo |

### Folder responsibilities

```
kovkasyanplennica/
├── apps/web/                    # Main Next.js application (storefront + admin + API)
│   ├── app/
│   │   ├── (main)/              # Public + admin pages (App Router)
│   │   │   ├── admin/           # Admin panel pages (mostly 'use client')
│   │   │   ├── products/        # Product listing + PDP
│   │   │   ├── cart, checkout, profile, ...
│   │   │   └── page.tsx         # Home (server component, ISR)
│   │   ├── api/v1/              # REST API (products, cart, orders, admin/*)
│   │   └── layout.tsx           # Root layout (server)
│   ├── components/              # Shared UI (ProductCard, Header, CategoryNavigation, ...)
│   ├── lib/
│   │   ├── services/            # Business logic (products, admin, cart, orders, search)
│   │   ├── cache/               # Redis keys, TTLs, withRedisCache
│   │   ├── auth/                # AuthContext, JWT, middleware
│   │   └── api-client/          # Frontend HTTP client
│   └── public/                  # Static assets (many mirrored to R2)
├── packages/db/                 # Prisma schema, migrations, client
├── packages/ui/                 # Shared Button, Card, Input
├── packages/design-tokens/      # Design tokens
├── scripts/                     # Migrations, menu import, Meilisearch reindex
└── Category/                    # Untracked menu image assets (not wired to app yet)
```

### Where key logic lives

| Concern | Location |
|---------|----------|
| Storefront pages | `apps/web/app/(main)/` |
| Admin panel | `apps/web/app/(main)/admin/` + `AdminLayoutShell.tsx` |
| Product listing | `apps/web/app/(main)/products/page.tsx` (server) + `ProductsCategoryCarousel.tsx` |
| Product detail (PDP) | `apps/web/app/(main)/products/[slug]/page.tsx` (server) + `ProductPageClient.tsx` (client) |
| ProductCard | `apps/web/components/ProductCard.tsx` + `ProductCard/*` |
| API routes | `apps/web/app/api/v1/` |
| DB access | `packages/db` + `apps/web/lib/services/**` |
| Shared hooks | `apps/web/components/hooks/` |
| Caching | `apps/web/lib/cache/` + per-service `withRedisCache` |

### Rendering model

- **Good:** Home (`page.tsx`), products list, PDP metadata/data fetching use **Server Components** with ISR/`unstable_cache`.
- **Heavy client boundary:** `(main)/layout.tsx` wraps all routes in `ClientProviders` → `MainSiteChrome` (client), forcing hydration of chrome on every page including admin.
- **Admin:** Nearly every admin `page.tsx` is `'use client'` and fetches via `apiClient` after mount.

---

## 3. Main Problems Found

| Area | Problem | Severity | Main Files | Recommended Action |
|------|---------|----------|------------|-------------------|
| Images | Global `images.unoptimized: true` | **High** | `apps/web/next.config.js`, 40+ components | Re-enable optimization for R2/CDN URLs or use R2 image transforms |
| Catalog API | Fetch up to 4000 products with deep includes, filter in memory | **High** | `products-find-query/query-executor.ts`, `products-find.service.ts`, `products-find-filter.service.ts` | Push filters/sort/pagination to SQL/Meilisearch |
| Filter API | Loads all products + variants + attributes for facet generation | **High** | `products-filters.service.ts` | Aggregate queries or cached facet index |
| Client bundle | SpinWheelPopup + Header + Auth on every page | **Medium** | `ClientProviders.tsx`, `SpinWheelPopup.tsx`, `Header.tsx` | Lazy-load SpinWheel; split chrome |
| ProductCard | Duplicate mobile card + non-card product UIs | **Medium** | `MobileRecipeProductCard.tsx`, wishlist/compare/cart | Unify or document intentional variants |
| Admin products | Client-side stock filter + partial client sort | **Medium** | `admin/products/page.tsx` | Move stock/sort to API |
| Admin add product | 5000+ LOC form across 30+ files, all client | **High** | `admin/products/add/**` | Split by domain; server-load reference data |
| Dead code | 6+ unused listing/filter components | **Low** | `CategoryGrid.tsx`, `ProductsHeader.tsx`, etc. | Verify + remove in cleanup phase |
| Caching | Strong TTL but undermined by over-fetch | **Medium** | `with-redis-cache.ts`, `public-cache-ttl.ts` | Fix query shape before tuning TTL |
| Mobile assets | Commit added 9–11 MB PNGs to repo history | **Medium** | `public/assets/mobile-home/*` (commit `5327383`) | Serve from R2 only; remove from git |
| Type duplication | `MenuItem` interface copied 5× | **Low** | `MenuClient.tsx`, `Favorites.tsx`, `MobileMenuClient.tsx`, ... | Extract shared type |
| Legacy files | `page.new.tsx`, `admin.service.new.ts` | **Low** | See §10 | Delete after verification |

---

## 4. Product Card Audit

### Component inventory

| Component | File | Used In | Problem | Recommendation | Risk |
|-----------|------|---------|---------|----------------|------|
| **ProductCard** (canonical) | `components/ProductCard.tsx` | `ProductsGrid`, `ProductsCategoryCarousel`, `RelatedProducts`, `MenuClient`, `Favorites`, `MobileMenuClient`, `MobileFavorites` | `'use client'`; 7 layout boolean props; each card runs `useAddToCart` + `useCurrency` | Keep as canonical; split presentational shell from cart actions later | **Medium** |
| ProductCardGrid | `components/ProductCard/ProductCardGrid.tsx` | Via ProductCard | `unoptimized` images; many layout classes | Merge layout props into variants enum | Low |
| ProductCardList | `components/ProductCard/ProductCardList.tsx` | Via ProductCard (list view) | Same image issue | Same as Grid | Low |
| ProductCardInfo | `components/ProductCard/ProductCardInfo.tsx` | Grid/List | Price/discount display logic | Keep sub-component | Low |
| ProductCardActions | `components/ProductCard/ProductCardActions.tsx` | Grid/List | Add-to-cart UI | Keep sub-component | Low |
| ProductCardLink | `components/ProductCard/ProductCardLink.tsx` | All card surfaces + search | `prefetch={false}` + hover prefetch (good) | Keep | Low |
| ProductColors | `components/ProductCard/ProductColors.tsx` | ProductCardInfo | Color swatches | Keep | Low |
| **MobileRecipeProductCard** | `components/mobileHomePage/MobileRecipeProductCard.tsx` | `MobileNewArrivalsSection.tsx` | **Duplicates** cart/link/price/image logic; different styling; `unoptimized` | Extend ProductCard with `variant="recipe"` or compose shared primitives | **Medium** |
| Search result row | `components/HeaderSearchOverlay.tsx` (inline) | Header search overlay | Intentionally compact; not full card | Optional: extract `ProductSearchResultRow` | Low |
| Wishlist item UI | `app/(main)/wishlist/page.tsx` | Wishlist | Custom layout; no ProductCard | Migrate to ProductCard `viewMode="list"` or compact grid | Medium |
| Compare item UI | `app/(main)/compare/page.tsx` | Compare | Custom table/cards; no ProductCard | Keep separate (different UX) or shared primitives | Medium |
| Cart line item | `app/(main)/cart/cart-components.tsx` | Cart | Custom; no ProductCard | Keep separate (quantity controls) | Low |
| Admin ProductPickerModal | `admin/spin-wheel/components/ProductPickerModal.tsx` | Spin wheel admin | Admin list rows, not storefront card | Keep separate | Low |
| Order item | `orders/[number]/components/OrderItem.tsx` | Order detail | Order-specific | Keep separate | Low |

### Props summary (canonical ProductCard)

```typescript
// apps/web/components/ProductCard.tsx
product: { id, slug, title, price, image, inStock, defaultVariantId?, stock?, brand, labels?, ... }
viewMode?: 'list' | 'grid-2' | 'grid-3'
compactHeight?, largeSize?, largeHeightOnDesktop?, largeCompactImage?, compactListing?
```

Each card instance calls `useAddToCart` and `useCurrency` internally — **N hooks per grid row** (expected for interactive cards, but prevents easy memoization).

### Current Product Card situation

- **There is one main reusable ProductCard** with sub-components (Grid/List/Info/Actions/Link).
- **One significant duplicate:** `MobileRecipeProductCard` (~130 LOC) reimplements link overlay, image, price, add-to-cart.
- **Several pages use bespoke product row UI** (wishlist, compare, search overlay, cart, admin) — some intentional due to different interactions.

### Recommended canonical ProductCard

**`apps/web/components/ProductCard.tsx`** (+ `ProductCard/*` subfolder) should remain canonical because:

- Already used across home, products carousel, related products, mobile menu/favorites.
- Has dedicated link prefetch strategy (`ProductCardLink` + `usePrefetchOnHover`).
- Supports list + grid modes needed by storefront.

### Components to replace later

1. `MobileRecipeProductCard` → ProductCard variant (highest priority duplicate).
2. Wishlist inline card → ProductCard list/compact mode.
3. Consider shared **ProductPrice** / **ProductImage** primitives for search overlay (optional).

### Safe migration strategy

1. Add `variant?: 'default' | 'recipe' | 'compact'` to ProductCard without removing MobileRecipeProductCard.
2. Snapshot visual regression on mobile new-arrivals + home menu.
3. Switch `MobileNewArrivalsSection` to canonical card behind feature flag or direct swap.
4. Migrate wishlist after variant proves stable.
5. Do **not** force ProductCard into cart/compare/admin — different interaction models.

### Unification risk

| Risk | Detail |
|------|--------|
| Visual regression | ProductCard uses restaurant-specific radii/shadows; mobile recipe card differs |
| Layout prop explosion | Already 5 boolean layout flags — unification may worsen API surface |
| Performance | More props → harder to `memo()`; cart hook per card remains |
| Add-to-cart behavior | Recipe card and list cards rely on `defaultVariantId` from API — must stay in sync |

---

## 5. Admin Panel Audit

| Page/Component | File | Problem | Cause | Recommendation | Risk |
|----------------|------|---------|-------|----------------|------|
| Products list | `admin/products/page.tsx` | Stock filter applied **client-side** after paginated API fetch | `stockFilter` not sent to API (lines 167–184) | Add `stock` query param; filter in SQL | **Medium** |
| Products list | `admin/products/page.tsx` | Price/title sort client-side only | `sortedProducts` useMemo (lines 197–228) | Extend admin products API sort | Low |
| Products list | `admin/products/page.tsx` | Re-fetch on every filter keystroke dependency | `useEffect` deps include `search`, `minPrice`, etc. | Debounce search; URL state | Low |
| Products table | `admin/products/components/ProductsTable.tsx` | Full table re-render on any selection change | No row memoization | Extract `ProductRow`; `memo` | Low |
| Add/Edit product | `admin/products/add/page.tsx` + hooks | **428-line VariantBuilder**, 10+ hooks, 30+ useState in form state | Historical feature growth | Domain split; server prefetch brands/categories | **High** |
| Add product data load | `admin/products/add/hooks/useProductDataLoading.ts` | Client fetch brands/categories/attributes on mount | Page is `'use client'` | Server component wrapper for reference data | Medium |
| Attributes | `admin/attributes/useAttributes.ts` (444 LOC) | Verbose debug logging on every value; full tree in memory | Dev logs left in production path | Remove logs; paginate values | Medium |
| Orders | `admin/orders/useOrders.ts` (440 LOC) | Large hook; modal loads full order detail | Client-side state monolith | Split hook; lazy-load order detail | Medium |
| Analytics | `admin/analytics/page.tsx` | Full client page; refetch on period change | Standard pattern but no skeleton caching | SWR-style stale-while-revalidate | Low |
| Spin wheel | `admin/spin-wheel/hooks/useSpinWheelAdmin.ts` | Product picker loads product list into modal | Client fetch | Paginate picker API | Medium |
| Admin layout | `admin/AdminLayoutShell.tsx` | Auth guard duplicated in every page | No shared admin route middleware component | Centralize guard in layout shell only | Low |
| Dashboard | `admin/hooks/useAdminDashboard.ts` | Multiple parallel API calls on mount | Confirmed reduced in `0a5cab0` | Batch dashboard endpoint | Low |
| All admin pages | `app/(main)/admin/**/page.tsx` | **~100% client components** | Auth + forms pattern | Hybrid RSC for static chrome | **Medium** |

### Admin UX observations

- Pagination exists for products/orders/categories (good).
- No virtualization on large tables — acceptable at 20 rows/page today.
- Add product form complexity is the **primary admin maintainability bottleneck** (estimated **~5,100 LOC** in `admin/products/add/` folder).

---

## 6. Performance Audit

### Frontend Performance

| File | Exact problem | Evidence | Recommended fix | Expected impact | Risk |
|------|---------------|----------|-----------------|-----------------|------|
| `next.config.js` | `images.unoptimized: true` globally | Line 98 | Set `unoptimized: false`; keep R2 remotePatterns; use CDN resizing | Large LCP/FCP improvement | **Medium** (test all image URLs) |
| 40+ components | Per-image `unoptimized` prop | Grep across `apps/web` | Remove where global config suffices | Smaller HTML; browser caching | Low |
| `ClientProviders.tsx` | `SpinWheelPopup` always mounted | Lines 17–19 | Dynamic import when idle / after interaction | Reduced initial JS | Low |
| `MainSiteChrome.tsx` | Client wrapper renders Header (467 LOC) on all non-admin pages | Full file `'use client'` | Server shell + client islands | Reduced hydration | **Medium** |
| `components/Header.tsx` | 467-line client component | Line count | Split search overlay lazy load | Faster TTI | Medium |
| `homePage/MenuClient.tsx` | Client pagination refetch with `cache: 'no-store'` | Lines 86–87 | Use cached API or pass all pages from server | Extra network on home | Low |
| `products/[slug]/ProductPageClient.tsx` | Client wrapper for entire PDP body | Required for interactivity | Keep; ensure minimal client subtree | — | Low |
| `components/hooks/useRelatedProducts.ts` | Client fetch if no initial data | Lines 72–96 | Already improved in `93574c5` (server prefetch) | — | Low |
| `SpinWheelPopup.tsx` | 708 LOC client component | Line count | Code-split | Bundle size | Low |
| 232 files | `'use client'` directives | Repo count | Audit which pages can be server-first | Broad hydration cost | **Medium** |

### Backend/API Performance

| File | Exact problem | Evidence | Recommended fix | Expected impact | Risk |
|------|---------------|----------|-----------------|-----------------|------|
| `products-find-query/query-executor.ts` | `rawFetchTake(limit) = min(limit * 10, 4000)` | Lines 8–12, 133 | DB-level pagination + filters | **Major** DB CPU/memory reduction | **High** |
| `products-find.service.ts` | Filter + paginate in memory after full fetch | Lines 37–45 | SQL WHERE for price/brand/color/size | Correct pagination totals | **High** |
| `products-find-filter.service.ts` | In-memory price/color/size filtering | Full service | Move to Prisma/Meilisearch filters | Faster API | **High** |
| `products-filters.service.ts` | `findMany` all products with variants + attributes | Lines 137–171 | Aggregation query or cached facets | Faster filter drawer | **High** |
| `admin-products-read/query-executor.ts` | `$queryRaw SELECT 1` on **every** list query | Lines 107–110 | Remove health check from hot path | Lower latency | Low |
| `admin-products-read/query-executor.ts` | Count query 10s timeout race | Lines 129–144 | DB index + approximate count | Faster admin list | Medium |
| `products-find-meilisearch.service.ts` | Fallback to DB over-fetch when Meili unavailable | Service design | Monitor Meili uptime | Prevents worst case | Low |
| `HeaderSearchOverlay.tsx` | Debounced search (300ms) — good | Line 13 | — | — | — |

### Database Performance

| File | Exact problem | Evidence | Recommended fix | Expected impact | Risk |
|------|---------------|----------|-----------------|-----------------|------|
| `packages/db/prisma/schema.prisma` | Product list queries join translations, variants, options, attribute values | Used in query includes | Select only fields needed for cards | Less I/O | Medium |
| `products-find-query/query-executor.ts` | Deep nested includes on up to 4000 rows | `getBaseInclude()` | Narrow selects | **Major** | High |
| `products-filters.service.ts` | Recursive category child IDs (N+1 pattern) | `getAllChildCategoryIds` | Single recursive CTE query | Faster facets | Medium |
| Schema | Good indexes on `categories`, `users`, `products.published` | schema.prisma | Review composite indexes for admin list filters | Needs verification | Low |

### Image/Asset Performance

| File | Exact problem | Evidence | Recommended fix | Expected impact | Risk |
|------|---------------|----------|-----------------|-----------------|------|
| `next.config.js` | Global unoptimized | Introduced in `5f27f75` | Re-enable optimization | **High** | Medium |
| `public/assets/mobile-home/` | Large PNGs committed (9–11 MB) in `5327383` | Git stat | R2-only hosting | Repo + deploy size | Low |
| `Category/` (untracked) | Many full-size menu photos at repo root | git status | Import pipeline + R2 upload | Disk/deploy | Low |
| `ProductCardGrid.tsx` | `sizes` attr set but `unoptimized` negates Next optimization | Line 119 | Fix global config | Bandwidth | Low |
| `scripts/upload-public-assets-to-r2.ts` | R2 upload exists | package.json scripts | Ensure all prod assets on R2 CDN | Latency | Low |

---

## 7. Duplicated Code and Shared Component Opportunities

| Duplicate Pattern | Files | Recommended Shared Component | Priority |
|-------------------|-------|------------------------------|----------|
| Product card UI | `MobileRecipeProductCard.tsx`, `ProductCard/*` | Extend `ProductCard` variants | **High** |
| `MenuItem` interface (5×) | `MenuClient.tsx`, `Favorites.tsx`, `MobileMenuClient.tsx`, `MobileFavorites.tsx`, `Menu.tsx` | `lib/types/menu-product.ts` | Medium |
| Currency hook (2×, different shapes!) | `components/hooks/useCurrency.ts` (returns `CurrencyCode`), `profile/hooks/useCurrency.ts` (returns `{ currency }`) | Single `useCurrency` in `lib/hooks/` | Medium |
| Currency event listeners | `admin/products/page.tsx`, `HeaderSearchOverlay.tsx`, profile hook | Shared `useCurrencySubscription` | Low |
| Admin auth guard | Every admin `page.tsx` | Only in `AdminLayoutShell` | Medium |
| Admin loading spinner | Most admin pages | `AdminLoadingState` component | Low |
| Image URL processing | `ProductsTable.tsx`, admin services | Existing `lib/utils/image-utils.ts` — use consistently | Low |
| Product list normalization | `products/page.tsx`, `MenuClient.tsx`, `pdp-supplemental.ts` | `normalizeProductListItem()` utility | Medium |
| Admin dashboard cards | `QuickActionsCard`, `RecentOrdersCard`, `TopProductsCard` | Already partially shared via `dashboardUi.ts` | Low |
| Duplicate admin service | `admin.service.ts`, `admin.service.new.ts` | Complete migration or delete `.new` | Low |

### What should remain separate

- **Cart line items** — quantity/stepper/checkout logic.
- **Compare table** — columnar comparison UX.
- **Admin product picker** — selection modal, not storefront marketing card.
- **PDP gallery + variant selectors** — not card concerns.

---

## 8. State Management Problems

| File | State Problem | User-visible Bug/Risk | Recommendation | Risk |
|------|---------------|----------------------|----------------|------|
| `admin/products/add/hooks/useProductFormState.ts` | 30+ `useState` in one hook | Form state bugs when editing complex variants | useReducer or form library (react-hook-form already in deps) | **High** |
| `admin/products/page.tsx` | Client stock filter on paginated data | Wrong counts / empty pages when filtering stock | Server-side stock filter | **Medium** |
| `homePage/MenuClient.tsx` | `items` state duplicates `initialItems`; refetch page 2+ | Flash on pagination | Router-based pagination or SWR | Low |
| `components/hooks/useRelatedProducts.ts` | Initializes from server props then may refetch | Extra request if props empty | Keep server prefetch (done in `93574c5`) | Low |
| `lib/auth/AuthContext.tsx` | Global auth state in client provider | All pages pay auth hydration cost | Acceptable; consider lazy init | Low |
| `admin/AdminLayoutShell.tsx` + each page | Duplicate redirect-if-not-admin | Race: flash of content | Guard only in layout | Low |
| `admin/attributes/useAttributes.ts` | Inline edit state mixed with fetch state | Stale UI on rapid edits | Optimistic updates + rollback | Medium |
| `wishlist/page.tsx` | localStorage + API sync | Desync across tabs | Storage event listener | Low |
| `MenuClient.tsx` / `MobileMenuClient.tsx` | Strip `labels`/`colors` when passing to ProductCard | Inconsistent card display vs desktop | Pass through or document | Low |

---

## 9. Git History / Root Cause Analysis

| Issue | Introduced In Commit | Author | Date | Evidence | Impact |
|-------|---------------------|--------|------|----------|--------|
| Monolithic ProductCard + in-memory catalog filtering | `d4d6c43` "tsx 480 line" | SipanBabajanyan | 2026-02-25 | Added large `ProductCard.tsx`; filter service pattern | Foundation of current card + query architecture |
| Home page Figma implementation + heavy client sections | `878e0d9` "home page full figmayi nman" | AKhanjyan (committed by SipanBabajanyan) | 2026-02-24 | Large home component additions | Increased client UI surface |
| Products page carousel + card layout flags | `04c151f` "productts page" | AKhanjyan | 2026-03-02 | Added `ProductsCategoryCarousel.tsx`, extended ProductCard props | More card variants; harder unification |
| Mobile home + **multi-MB PNG assets** | `5327383` "mobile home" | AKhanjyan | 2026-04-06 | `banner-dish.png` 11MB, `card-salad.png` 9MB | Repo bloat; slow clones/deploys |
| Duplicate mobile product card | `3afe703` "card" | AKhanjyan | 2026-04-06 | Added `MobileRecipeProductCard.tsx` | Second card implementation |
| Redis + Meilisearch caching layer | `741b1a4` "redis" | AKhanjyan | 2026-05-22 | `with-redis-cache.ts`, search route, cache service | Improved repeat traffic; didn't fix over-fetch |
| **Global image unoptimization for R2** | `5f27f75` "feat(web): load public /assets from Cloudflare R2" | Karo Gabrielyan | 2026-05-11 | `next.config.js` `unoptimized: true` | **Major LCP regression risk** |
| Next.js 16 upgrade + PDP server prefetch for related/reviews | `93574c5` | Manvel-Lambaryan | 2026-06-29 | `page.tsx`, `useRelatedProducts.ts`, `site-navigation.ts` | Positive: reduced client waterfalls |
| Admin products/analytics refactor | `0a5cab0` "admin" | AKhanjyan | 2026-06-30 | Admin hooks, formatter, analytics | Partial cleanup; client patterns remain |
| ProductCard hover prefetch | `3d69bfd` "prefetch" | SipanBabajanyan | 2026-07-01 | `ProductCardLink.tsx`, `use-prefetch-on-hover.ts` | Positive: navigation perf |
| In-memory cache fallback for Redis | `b984632` "single" | SipanBabajanyan | 2026-07-01 | Extended `with-redis-cache.ts` | Helps dev; masks missing Redis in prod if unnoticed |

*Note: Commit dates use author timezone (+0400). Merge commits omitted for clarity.*

---

## 10. Unused / Dead Code Candidates

*Verified by ripgrep import analysis — no external imports found unless noted.*

| File | Why It Looks Unused | Safe To Remove? | Risk | Notes |
|------|---------------------|-----------------|------|-------|
| `components/ProductsGrid.tsx` | No importers | **Needs verification** | Low | May have been replaced by `ProductsCategoryCarousel` |
| `components/CategoryGrid.tsx` (352 LOC) | No importers; self-contained fetch logic | **Needs verification** | Medium | Large file; confirm not used dynamically |
| `components/ProductsHeader.tsx` (411 LOC) | No importers | **Needs verification** | Low | Superseded by `ProductsShopToolbar`? |
| `components/MobileFiltersDrawer.tsx` | No importers | **Needs verification** | Low | Products page uses sidebar toolbar |
| `components/HomeCategoriesSidebar.tsx` | No importers | **Needs verification** | Low | |
| `components/CategoriesSidebar.tsx` | No importers | **Needs verification** | Low | |
| `app/(main)/products/[slug]/page.new.tsx` | Old client-only PDP; not routed | **Likely yes** | Medium | Compare with current `page.tsx` before delete |
| `lib/services/admin.service.new.ts` | Zero imports in repo | **Likely yes** | Low | Incomplete migration stub |
| `app/(main)/admin/dekstops/page.tsx` | Typo alias redirect only | Keep | Low | Harmless redirect to `/admin/desktops` |
| `Category/` image folders | Untracked in git status | N/A | Low | Not dead code — import pipeline pending |

---

## 11. Recommended Fix Plan

### Phase 1: Safe fixes (low risk, high impact)

1. **Re-enable Next.js image optimization** for R2/CDN domains (remove global `unoptimized: true`; test PDP, home, cards).
2. **Remove `$queryRaw SELECT 1`** from admin product list hot path.
3. **Debounce admin product search** input (300ms) to reduce API churn.
4. **Remove debug `console.log` loops** in `useAttributes.ts` (lines 62–78).
5. **Lazy-load `SpinWheelPopup`** via `next/dynamic` with `ssr: false`.
6. **Move admin stock filter** to API query parameter.

### Phase 2: Component unification

1. Add ProductCard `variant="recipe"` matching `MobileRecipeProductCard` visuals.
2. Extract shared `MenuProduct` type; deduplicate 5× `MenuItem` interfaces.
3. Consolidate `useCurrency` hooks (fix return type inconsistency).
4. Migrate wishlist to ProductCard compact/list mode.

### Phase 3: Admin optimization

1. Server-load brands/categories/attributes for add-product page (RSC wrapper).
2. Split `useProductFormState` into reducers per domain (basic info, variants, media, labels).
3. Batch dashboard API endpoints.
4. Paginate spin-wheel product picker.

### Phase 4: API/database optimization

1. Replace `limit * 10` over-fetch with proper SQL pagination.
2. Push price/brand/color/size filters to Prisma/Meilisearch.
3. Rewrite `products-filters.service.ts` with aggregation queries + Redis facet cache.
4. Add composite indexes for admin list filters (needs EXPLAIN verification on Neon).

### Phase 5: Cleanup

1. Delete verified dead components (§10).
2. Remove `page.new.tsx`, `admin.service.new.ts`.
3. Purge large binary assets from git history (optional BFG) if still tracked.
4. Wire `Category/` images through R2 upload script.

---

## 12. Do Not Touch Yet

| Area | Reason |
|------|--------|
| `admin/products/add/**` form submit pipeline | High regression risk; touches variants, attributes, images, discounts |
| Prisma schema migrations | Requires staged rollout on Neon |
| `products-find-meilisearch.service.ts` fallback logic | Production safety net when search index stale |
| `lib/auth/` + `proxy.ts` middleware | Security-sensitive |
| Checkout / payment / order creation flows | Revenue-critical |
| `with-redis-cache.ts` stampede protection | Removing may cause DB thundering herd |
| Menu import scripts (`scripts/import-menu-from-excel.ts`) | Operational tooling for content team |
| `ProductCardLink` prefetch=false + hover prefetch | Recently added (`3d69bfd`); intentional perf tradeoff |

---

## 13. Final Recommendation

Kovkasyan Plennica is a **feature-rich monorepo with solid foundations** (Server Components on key pages, Redis/ISR caching, unified ProductCard on main listing surfaces, Meilisearch integration). The project is **not suffering from dozens of unrelated ProductCard implementations** — the canonical card is real and widely adopted. The main technical debt clusters are:

1. **Data layer shape** (over-fetch + in-memory filter) — this is the single biggest scalability issue.
2. **Global image unoptimization** — the single biggest perceived performance issue for end users.
3. **Admin client architecture** — maintainability and perceived slowness for operators.
4. **One duplicate mobile card** + **dead legacy listing components** — cleanup opportunity.

**Do not start with a ProductCard rewrite.** Start with **query and image optimization** (Phase 1 + Phase 4), then unify `MobileRecipeProductCard`, then tackle admin form architecture.

All git-history claims above are backed by commit hash, author, and date from local `git log` / `git show`. Runtime performance metrics (LCP, TTFB, bundle KB) were **not measured** in this audit — marked as **Needs verification** for production profiling (Lighthouse, Vercel Analytics, Neon query insights).

---

*End of audit. Awaiting review before any code changes.*
