# Phase 8 Server-First ProductCard Debug

**Date:** 2026-07-02  
**Branch:** `dev-Karo`  
**Phase type:** DEBUG / AUDIT ONLY — no production code changes  
**Scope:** Feasibility of splitting `ProductCard` into a server-rendered shell plus small client islands to reduce `/products` hydration cost after Phase 7

---

## Git state

| Item | Value |
|------|-------|
| **Branch** | `dev-Karo` |
| **Tracking** | Up to date with `origin/dev-Karo` |
| **Latest commits** | `c74c76d` perf(products): reduce shop SSR payload with lazy rows · `56b56ed` perf(products): trim shop page payload and cache tags · `68345bc` perf(products): replace filter scans with shared catalog queries |
| **Phase 7 completed** | **Yes** — `c74c76d` pushed |
| **Local debug/test files** | Pre-existing untracked debug markdown + Phase 5D scripts; modified `PHASE_1_DEBUG_STATUS.md` |
| **Production code changed** | **no** (this audit only) |

---

## Prior reports confirmed

| Finding | Still true after Phase 7 |
|---------|--------------------------|
| Phase 7 deferred full server-first `ProductCard` split to Phase 8 | **Yes** |
| Phase 7 focused on reducing product volume crossing server/client boundary | **Yes** — `defaultVariantId` in HTML dropped 35 → 9 |
| `ProductCard` remains a client-heavy subtree | **Yes** — every card still hydrates full client tree |
| Wishlist/compare not mounted on `/products` carousel path | **Yes** — `ProductCardActions` is not imported anywhere |
| Currency switching and add-to-cart are main client-only blockers | **Yes** |

---

## Current measurements after Phase 7

**Environment:** Local dev, `http://localhost:3000`

| URL | Run 1 | Run 2 | Size (RawContentLength) | defaultVariantId | `__next_f.push` | Notes |
|-----|-------|-------|-------------------------|------------------|-----------------|-------|
| `/products` | 846 ms | — | **220,464 B** | **9** | **25** | Phase 7 target ~210 KB missed by ~10 KB; variant count target met |
| `/products?category=sousy` | 550 ms | — | **171,585 B** | — | — | No regression vs Phase 7 debug (~176 KB) |
| `/products?page=2` | 569 ms | — | **243,780 B** | — | — | Still large — lazy rows + capped SSR on page 2 not as aggressive |
| `/products?sort=price-asc` | 640 ms | — | **246,670 B** | — | — | Sort param does not shrink payload |

### Phase 7 target vs current

| Metric | Phase 7 debug baseline | After Phase 7 (`c74c76d`) | Target | Result |
|--------|--------------------------|---------------------------|--------|--------|
| `/products` RawContentLength | ~301 KB | **~215 KB** | < 210 KB | **~27% win**; slightly above 210 KB stretch goal |
| `defaultVariantId` count | 35 | **9** | < 18 | **Pass** |
| Warm TTFB | ~450 ms | ~550–850 ms (variance) | ≤ 550 ms | Acceptable in dev; no clear regression pattern |

### Room remaining for Phase 8

Phase 7 removed most **serialized product prop waste**. Remaining cost is primarily:

1. **Client JS bundle + hydration** for each mounted `ProductCard` (hooks: `useAddToCart`, `useCurrency`, `useTranslation`, `usePrefetchOnHover`, `next/image`, image error state).
2. **`ProductsCategoryCarousel` client boundary** — expand/sort/visible-columns logic keeps entire card subtree client-side.
3. **Above-fold rows** still hydrate up to ~12 cards immediately (3 rows × 4 capped products).

Phase 8 should target **hydration/JS**, not another large HTML byte drop.

---

## ProductCard usage map

| File | Surface | Uses ProductCard? | Layout | Needs actions? | Risk if changed |
|------|---------|-------------------|--------|----------------|-----------------|
| `ProductsCategoryCarousel.tsx` | `/products` category rows | **Yes** | `grid-3`, compact listing | Add-to-cart only | **High** — primary Phase 8 target |
| `LazyCategoryProductsSection.tsx` | `/products` below-fold rows | **Indirect** (via carousel) | Same | Add-to-cart | **High** |
| `RelatedProducts.tsx` | PDP related carousel | **Yes** | `grid-3` | Add-to-cart | Medium |
| `ProductsGrid.tsx` | Legacy listing grid (not mounted on `/products` today) | **Yes** | `grid-3` / `list` | Add-to-cart | Medium |
| `homePage/MenuClient.tsx` | Home menu section | **Yes** | `grid-3` | Add-to-cart | Medium |
| `homePage/Favorites.tsx` | Home favorites | **Yes** | `grid-3` | Add-to-cart | Medium |
| `mobileHomePage/MobileMenuClient.tsx` | Mobile home menu | **Yes** | `grid-3` | Add-to-cart | Medium |
| `mobileHomePage/MobileFavorites.tsx` | Mobile favorites | **Yes** | `grid-3` | Add-to-cart | Medium |
| `mobileHomePage/MobileRecipeProductCard.tsx` | Mobile recipe cards | **Partial** — reuses link/hooks, not full `ProductCard` | Custom | Add-to-cart | Medium |
| `HeaderSearchOverlay.tsx` | Search overlay | **Link only** (`ProductCardLink`) | N/A | No | Low |

**Wishlist/compare pages:** Do not use `ProductCard`; they use dedicated page components.

---

## ProductCard component tree

| Component | Client reason | Server-feasible? | Proposed future role |
|-----------|---------------|------------------|----------------------|
| `ProductCard.tsx` | `'use client'`; `useAddToCart`, `useCurrency`, `useState(imageError)` | **Shell yes, as-is no** | Split into server shell + islands |
| `ProductCardGrid.tsx` | Imported by client parent; layout + `Image` `onError` | **Mostly yes** | Server markup; isolate image error to tiny client wrapper |
| `ProductCardInfo.tsx` | `useTranslation`; receives `currency` for `formatPrice` | **Partial** | Server title/category; client price island |
| `ProductCardLink.tsx` | `usePrefetchOnHover` | **Yes with plain `<Link>`** | Server `<Link prefetch={false}>` on `/products`; keep hover prefetch elsewhere if needed |
| `ProductCardList.tsx` | Client parent; list layout | **Deferred** | Keep client for list mode pages |
| `ProductCardActions.tsx` | Wishlist/compare/cart UI | **N/A on `/products`** | **Unused** in repo imports — dead file for listing paths |

### Why is `ProductCard.tsx` client?

Top-level `'use client'` plus hooks that require browser/cart context:

- `useAddToCart` — cart API, guest localStorage, auth, router
- `useCurrency` — listens to `currency-updated` / `currency-rates-updated`
- `useState(imageError)` — image fallback

All children are client-only **because the parent is client**, not because each child independently requires client APIs (except `ProductCardLink` prefetch hook and `ProductCardInfo` i18n/formatPrice).

---

## Client-only requirements

### Add to cart

**Minimum props** (from `useAddToCart` + `ProductCard.tsx`):

```typescript
type ProductCardAddToCartIslandProps = {
  productId: string;
  slug: string;
  title: string;
  image?: string | null;
  price: number;
  originalPrice?: number | null;
  defaultVariantId?: string | null;
  stock?: number | null;
  inStock: boolean;
};
```

| Question | Answer |
|----------|--------|
| Can add-to-cart be isolated to one small client button? | **Yes** — button + `useAddToCart` hook only |
| Does it need whole product object? | **No** — snapshot fields above suffice when `defaultVariantId` present |
| Does it need category/brand/description? | **No** for instant add path |
| Does it need current currency? | **No** — cart stores base AMD/listing price |
| What breaks if only the button is client? | Nothing on `/products` if price island handles display currency separately |

**Risk:** Low on `/products` when `defaultVariantId` is always provided (Phase 7 preserves this).

### Currency

| Question | Answer |
|----------|--------|
| Does currency formatting require full card client? | **No** — only price display needs `useCurrency` + `formatPrice` |
| Can price become a small client island? | **Yes** — ~20 lines client component |
| Server AMD fallback possible? | **Yes** — render `formatPrice(price, 'AMD')` server-side, island replaces after hydration |
| Does currency switch update visible cards today? | **Yes** — `useCurrency` in every `ProductCard` |
| Cart price uses base AMD or displayed currency? | **Base listing AMD** in local snapshot path |

**Risk:** Low — use `suppressHydrationWarning` on price span if server/client currency differs at first paint.

### Wishlist / compare

| Question | Answer |
|----------|--------|
| Used on `/products`? | **No** — `ProductCardActions` not imported |
| Used elsewhere via `ProductCard`? | **No** — not wired into current grid/info path |
| Phase 8 action | **Omit entirely** on new `/products` server card |

### Link / prefetch

| Question | Answer |
|----------|--------|
| Current behavior | `ProductCardLink` disables Next prefetch, warms route on hover/focus via `usePrefetchOnHover` |
| Server-safe replacement on `/products`? | **Yes** — plain `<Link href prefetch={false}>` |
| Critical for perceived speed? | **Nice-to-have** — warm product APIs already fast; Phase 7 expand fetch uses `/api/v1/products` |
| Phase 8 recommendation | Drop custom prefetch on `/products` server card; keep on home/PDP if desired |

---

## Carousel split requirement

### Can server `ProductCard` render inside current client `ProductsCategoryCarousel`?

**No — not by importing a server component into the client carousel file.**

`ProductsCategoryCarousel` is `'use client'` and directly imports `ProductCard`. In App Router, a client component cannot import a server component. Passing server components as `children` from a server parent is allowed, but the carousel currently **maps products internally** and renders cards itself.

### Does carousel need server/client split?

**Yes, for meaningful Phase 8 win on `/products`.**

Required shape:

```
ProductsPageMainSlot (server)
  └─ section + h2 (server, SEO)
       ├─ above-fold: ProductsCategoryRow (server)
       │    ├─ grid of CatalogProductCardShell (server)
       │    │    ├─ ProductCardPriceIsland (client)
       │    │    └─ ProductCardAddToCartIsland (client)
       │    └─ ProductsCategoryExpandControls (client)
       └─ below-fold: LazyCategoryProductsSection (client IO) wrapping same row pattern OR fetch-then-server-render via RSC
```

| Concern | Answer |
|---------|--------|
| Responsive columns without `useVisibleCards`? | **CSS grid** with `grid-cols-2 md:grid-cols-3 xl:grid-cols-4` can replace JS column counting for static SSR grids; expand button may still need client column math OR fixed row height |
| `visibleRows` state | Keep **client-only expand control**; server renders first visible slice |
| Conflict with Phase 7 lazy rows? | **No** — lazy section can mount server row + client islands when intersecting; do not revert Phase 7 caps |

---

## Architecture options

| Option | Description | Expected win | Risk | Files | Recommendation |
|--------|-------------|--------------|------|-------|----------------|
| **A — `/products`-only server card** | New `CatalogProductCardShell` (server) + price/cart islands; keep existing `ProductCard` elsewhere | **Medium** — fewer hydrated hooks per visible card on shop | **Low–Medium** | 4–8 new/split components under `components/products/` | **Recommended** |
| **B — Refactor shared `ProductCard` globally** | Split existing tree for all usages | **High** across app | **High** — home, PDP related, mobile, list mode | 10+ files | Defer |
| **C — Hybrid keep carousel client** | Keep `ProductsCategoryCarousel`, try to shrink props only | **Low** — Phase 7 already did prop/volume trim | Low | 0–2 | **Insufficient** for Phase 8 goals |

---

## Risks to other surfaces

| Surface | ProductCard? | List mode? | Wishlist/compare? | Hover prefetch? | Phase 8 action |
|---------|-------------|------------|-------------------|-----------------|----------------|
| `/products` | Yes | No | No | Optional | **Migrate to server shell** |
| PDP related | Yes | No | No | Yes | **Keep client `ProductCard`** |
| Home menu/favorites | Yes | No | No | Yes | **Keep client `ProductCard`** |
| Mobile home | Yes | No | No | Partial | **Keep client `ProductCard`** |
| `ProductsGrid` (legacy) | Yes | Yes | No | Yes | **Keep client `ProductCard`** |
| Search overlay | Link only | N/A | No | Yes | Unchanged |

---

## Build / bundle check

| Check | Result |
|-------|--------|
| `npm run build --workspace=@shop/web` | **Pass** (compile mode) |
| Prisma EPERM on `db:generate` | **Yes** — engine locked by dev server; build used existing client |
| Bundle analyzer configured? | **No** — no `ANALYZE`, `webpack-bundle-analyzer`, or `@next/bundle-analyzer` in `next.config.js` / scripts |
| `optimizePackageImports` | Present in Next defaults only |
| Recommendation | Optional Phase 9 — add analyzer once to quantify `ProductCard` chunk size before/after |

---

## Recommended Phase 8 implementation plan

**Choose ONE:** **Option A — `/products`-only server card + carousel row split**

### Goal

Reduce `/products` **hydration cost and client JS** by rendering static card markup on the server and mounting only **price** and **add-to-cart** client islands per visible card, without changing PDP/home/related listings.

### Exact approach

1. Add `CatalogProductCardShell.tsx` (server) — image, title, category label, layout classes copied from `ProductCardGrid` + `ProductCardInfo` presentational parts.
2. Add `ProductCardPriceIsland.tsx` (client) — `useCurrency` + `formatPrice` + discount badge.
3. Add `ProductCardAddToCartIsland.tsx` (client) — `useAddToCart` button only.
4. Add `ProductsCategoryRow.tsx` (server) — renders capped product grid + passes islands; accepts expand metadata.
5. Refactor `ProductsCategoryCarousel.tsx` → slim `ProductsCategoryExpandControls.tsx` (client) for expand/collapse/fetch only, **or** replace carousel card mapping with server row component for above-fold rows.
6. Update `LazyCategoryProductsSection` to mount server row pattern after intersection (client wrapper fetches products, server cannot run after client fetch — **use client row that composes server shell via server parent pattern OR render static HTML from fetched data with islands**).
7. Keep existing `ProductCard.tsx` unchanged for all non-shop surfaces.

**Important implementation note:** For below-fold lazy rows that client-fetch products, the clean pattern is a **server parent** that receives fetched data through a small client bridge, or accept client-rendered islands-only cards for lazy rows in v1 and server shells for above-fold only (partial win).

### Files expected (6–10)

- `apps/web/components/products/CatalogProductCardShell.tsx` (new, server)
- `apps/web/components/products/ProductCardPriceIsland.tsx` (new, client)
- `apps/web/components/products/ProductCardAddToCartIsland.tsx` (new, client)
- `apps/web/components/products/ProductsCategoryRow.tsx` (new, server)
- `apps/web/components/ProductsCategoryCarousel.tsx` (shrink to expand controls or replace)
- `apps/web/components/products/LazyCategoryProductsSection.tsx` (adapt mount pattern)
- `apps/web/app/(main)/products/page.tsx` (wire server rows)

### What stays unchanged

- Product API routes, query-builder, Prisma, Redis/cache
- Existing `ProductCard` on home, PDP related, mobile, legacy grid
- Phase 7 row caps, lazy below-fold rows, expand fetch, filtered fetch cap
- Filters, admin, debug markdown

### Success metric

| Metric | Target |
|--------|--------|
| `/products` First Load JS / hydrated component count | Measurable drop vs Phase 7 baseline |
| `/products` RawContentLength | No regression above Phase 7 (~215 KB) |
| Add-to-cart on first visible card | Works without extra fetch |
| Currency switch | Visible prices update |
| PDP/home related cards | Unchanged behavior |

### Tests

1. `/products` — above-fold cards render SSR HTML; cart + currency work after hydration.
2. Expand row (e.g. Соусы) — remaining products load; islands work on fetched cards.
3. Sort URLs — order correct within row.
4. `?page=2`, `?category=sousy` — no regression.
5. Home menu + PDP related — still use legacy `ProductCard`.
6. `/cart`, `/wishlist`, `/compare` — no crash.

### Stop conditions

1. Server shell breaks responsive layout vs current carousel.
2. Add-to-cart regresses without `defaultVariantId`.
3. Lazy below-fold rows fail to mount islands.
4. Measurable hydration win is zero — do not commit cosmetic split.

### Commit message

```
perf(products): server-first catalog cards with client cart and price islands
```

### Risk level

**Medium** — layout parity and lazy-row composition are the main risks; scoped to `/products` only.

---

## Postponed items (Phase 8)

| Item | Reason |
|------|--------|
| Global `ProductCard` refactor (Option B) | High blast radius |
| Wishlist/compare on shop cards | Not used today |
| Remove `usePrefetchOnHover` globally | Keep on home/PDP for now |
| Bundle analyzer setup | Optional Phase 9 |
| DB sort replacing client carousel sort | Out of scope |
| `ProductCardList` server split | No `/products` list mode |

---

## Summary

| Item | Finding |
|------|---------|
| **Phase 7 outcome** | Meaningful SSR payload win (~27%); `defaultVariantId` 35 → 9 |
| **Remaining bottleneck** | Full client `ProductCard` hydration per visible card |
| **Server-first feasible?** | **Yes on `/products` only**, with carousel/row restructure |
| **Carousel split needed?** | **Yes** — cannot import server card into current client carousel |
| **Smallest client islands** | Price + add-to-cart buttons |
| **Recommended plan** | Option A — new server catalog card shell + islands; keep legacy `ProductCard` elsewhere |

**One-sentence recommendation:** Phase 8 should introduce a `/products`-only server-rendered catalog card shell with tiny price and add-to-cart client islands, which requires splitting the category row rendering out of `ProductsCategoryCarousel` while leaving the existing `ProductCard` untouched on home, PDP, and related surfaces.
