# Phase 1B Stock Filter Debug

**Date:** 2026-07-01  
**Scope:** Read-only investigation. No application code was changed for Phase 1B.  
**Branch:** `dev-Karo`

---

## 0. Repo Status

| Check               | Result |
| ------------------- | ------ |
| Current branch      | `dev-Karo` |
| Phase 1A committed? | **NO** — Phase 1A changes are uncommitted working-tree edits |
| Uncommitted files   | `PHASE_1_DEBUG_STATUS.md`, `apps/web/app/(main)/admin/attributes/useAttributes.ts`, `apps/web/app/(main)/admin/products/components/ProductFilters.tsx`, `apps/web/app/(main)/admin/products/page.tsx`, `apps/web/lib/services/admin/admin-products-read/query-executor.ts`, untracked `PHASE_1A_DEBOUNCE_DEBUG.md`, `PHASE_1A_VERIFICATION.md`, `apps/web/lib/hooks/useDebouncedValue.ts` |
| Target files dirty? | **Partially** — `page.tsx`, `ProductFilters.tsx`, and `query-executor.ts` already modified by Phase 1A; `query-builder.ts`, `route.ts`, `types.ts`, and `product-formatter.ts` are clean |

**Recent commits (HEAD):**

```
dad7717 Add technical audit docs, R2 asset migration, and menu import tooling.
4358f6d Merge pull request #112 from neetrino/dev-arm
cf6cf29 Merge main into dev-arm and drop tsbuildinfo cache file.
087edcd Add ellipsis to categories loading text.
3c22740 Ignore TypeScript build cache to prevent merge conflicts.
```

**Phase 1A uncommitted diff summary:**

| File | Phase 1A change |
| ---- | --------------- |
| `page.tsx` | Added `useDebouncedValue` (300ms) for title/SKU search; fetch deps and API params use debounced values |
| `ProductFilters.tsx` | Title search `onChange` now calls `setPage(1)` |
| `query-executor.ts` | Removed noisy `await db.$queryRaw\`SELECT 1\`` before list query |
| `useAttributes.ts` | Removed noisy admin attributes debug logs (outside Phase 1B scope) |

**Recommendation before Phase 1B implementation:** Commit Phase 1A separately, then implement Phase 1B on a clean follow-up commit/PR so stock-filter changes are not mixed with debounce/debug cleanup.

---

## 1. Current Stock Filter Flow

### Step-by-step

1. **User changes stock filter** — `<select>` in `ProductFilters.tsx` (`filterByStock`) calls `setStockFilter('all' | 'inStock' | 'outOfStock')` and `setPage(1)`.

2. **Frontend state update** — `stockFilter` lives in `page.tsx` (`useState<'all' | 'inStock' | 'outOfStock'>('all')`). It is included in the `useEffect` dependency array that triggers `fetchProducts()`.

3. **API request params** — `fetchProducts()` builds params: `page`, `limit`, optional `search`, `category`, `sku`, `minPrice`, `maxPrice`, `sort`. **`stockFilter` is not sent to the API.**

4. **Server query** — `GET /api/v1/admin/products` → `validateAndNormalizeFilters()` → `adminService.getProducts()` → `buildProductWhereClause()` → `executeProductListQuery()` with `skip`/`take` pagination and `db.product.count({ where })`. No stock-related filter exists in the where clause.

5. **Client post-processing** — After the API returns one paginated page (20 products), `page.tsx` lines 170–187 filter that page client-side:
   - Computes `totalStock` from `colorStocks` sum if non-empty, else `product.stock`
   - `inStock`: keep products where `totalStock > 0`
   - `outOfStock`: keep products where `totalStock === 0`

6. **Table render** — Filtered array is stored in `products`, optionally client-sorted (`sortedProducts` for title/price), then rendered by `ProductsTable`. The table does **not** display a stock column; stock data is only used for filtering.

7. **Pagination/meta behavior** — `setMeta(response.meta)` uses server meta from the **unfiltered** query. `meta.total`, `meta.totalPages`, and pagination UI reflect all products matching server filters (search, category, SKU, etc.), **not** the stock filter. A page can show fewer than 20 rows or zero rows while pagination still indicates more pages exist.

### Step 1 answers (UI flow)

| # | Question | Answer |
| - | -------- | ------ |
| 1 | Where is `stockFilter` state stored? | `page.tsx` line 36: `useState<'all' \| 'inStock' \| 'outOfStock'>('all')` |
| 2 | Possible values? | `'all'`, `'inStock'`, `'outOfStock'` |
| 3 | Which UI control changes it? | Stock `<select>` in `ProductFilters.tsx` lines 168–179 |
| 4 | Does changing stock filter reset page to 1? | **Yes** — `setPage(1)` in `onChange` (`ProductFilters.tsx:172`) |
| 5 | Is `stockFilter` sent to API params? | **No** |
| 6 | Client-side filtering? | **Yes** |
| 7 | Where exactly? | `page.tsx:170–187` inside `fetchProducts()` after API response |
| 8 | After pagination? | **Yes** — server paginates first; client filters the returned page slice |
| 9 | Does server `meta.total` ignore stock filter? | **Yes** |
| 10 | User-visible bugs? | Empty/incomplete pages; wrong total/page count; missing in-stock products on later pages; false negatives when cheapest published variant is out of stock but another variant has stock |
| 11 | Does stock filter affect sorting? | Indirectly — client sort runs on post-filter `products` array only; sort order is wrong across full dataset |
| 12 | Does stock filter affect selected rows? | `selectedIds` are **not** cleared on stock filter change; `toggleSelectAll` selects only current filtered page products |
| 13 | Does clear filters reset stock filter and page? | **Yes** — `handleClearFilters()` sets `stockFilter` to `'all'` and `page` to `1` (`page.tsx:279–284`) |

---

## 2. Confirmed Problems

| Problem | Evidence File | Code Evidence | User Impact | Severity |
| ------- | ------------- | ------------- | ----------- | -------- |
| Stock filter not sent to API | `page.tsx` | `fetchProducts()` builds `params` without `stock`; `stockFilter` only in `useEffect` deps | Server returns unfiltered paginated data | **High** |
| Filtering after paginated fetch | `page.tsx` | Lines 168–187: `filteredProducts = response.data.filter(...)` after API call | Page may show 0–19 rows instead of 20; many matching products never appear | **High** |
| Wrong meta/pagination | `page.tsx`, `ProductsTable.tsx` | `setMeta(response.meta)` unchanged; pagination uses `meta.totalPages` / `meta.total` | Admin sees incorrect “showing page X of Y (total Z)” and can navigate to empty pages | **High** |
| Incomplete stock calculation for filter | `product-formatter.ts`, `query-executor.ts`, `page.tsx` | Formatter sets `stock` from **one** variant (`variants[0]` after `take: 1`, cheapest published); `colorStocks: []` always; client filter uses that single value | Multi-variant product with stock on non-cheapest variant misclassified as out of stock | **High** |
| `colorStocks` always empty | `product-formatter.ts` | Line 72: `colorStocks: [] // Can be enhanced later` | Client fallback to `colorStocks` never applies; filter relies on single-variant `stock` | **Medium** |
| Price filters sent but not applied server-side | `page.tsx`, `query-builder.ts` | Frontend sends `minPrice`/`maxPrice`; `buildProductWhereClause` ignores them | Pre-existing; out of Phase 1B scope but affects combined filter testing | **Low** (pre-existing) |

---

## 3. Product / Variant Stock Model

| Question | Answer | Evidence File |
| -------- | ------ | ------------- |
| Which Prisma model stores stock? | **`ProductVariant`** | `packages/db/prisma/schema.prisma` |
| Stock on Product, Variant, or both? | **Variant only** — `Product` has no stock field | `schema.prisma` `Product` model (lines 200–231), `ProductVariant` (lines 253–278) |
| Field name | `stock` (also `stockReserved` for reservations) | `ProductVariant.stock`, `ProductVariant.stockReserved` |
| Is stock nullable? | **No** — `Int @default(0)` | `schema.prisma:261` |
| Is stock numeric? | **Yes** — `Int` | `schema.prisma:261` |
| Are variants always required for products? | **On create, yes** — POST requires non-empty `variants` array | `route.ts:315–325` |
| Can a product have zero variants? | **Possible in DB** (e.g. manual DB ops or future deletes) — not enforced at list-query level | Schema allows empty `variants` relation; no DB constraint requiring ≥1 variant |
| Variant status fields | **`published: Boolean @default(true)`** — no `active`, `enabled`, `deleted`, or `trashed` on variant | `schema.prisma:266` |
| Should unpublished variants count for stock? | **Owner decision** — schema supports `published`; storefront variant API uses `stock > 0 && published === true` | `apps/web/app/api/v1/products/variants/[id]/route.ts:46` |
| Product published/status for admin list? | Admin list includes **all non-deleted products** (`deletedAt: null`); does **not** filter by `Product.published` | `query-builder.ts:8–10` |
| Admin query includes all variants or one? | **One variant** in list query: `published: true`, `take: 1`, `orderBy: { price: 'asc' }` | `query-executor.ts:13–17` |
| Formatter stock source | **Single cheapest published variant** — `variants[0]` after include | `product-formatter.ts:46–48, 69` |
| What is `colorStocks`? | Frontend type for per-color stock breakdown (`{ color, stock }[]`) | `apps/web/app/(main)/admin/products/types.ts:11–14` |
| Why is `colorStocks: []` returned? | Explicit placeholder — not implemented in admin list formatter | `product-formatter.ts:72` |
| Display compatibility after server-side filtering | Table has **no stock column**; only filter logic consumes stock. Formatter `stock` field can remain as-is for Phase 1B without UI breakage | `ProductsTable.tsx` — no stock column |

**Product-level fields relevant to admin list:**

| Field | Purpose |
| ----- | ------- |
| `Product.deletedAt` | Soft delete — excluded when `null` filter applied |
| `Product.published` | Shown/toggled in table; not used in list where clause |
| `ProductVariant.published` | Used in list include filter; candidate for stock semantics |

---

## 4. API / Query Builder Flow

| Layer | File | Current Behavior | Required Change |
| ----- | ---- | ---------------- | --------------- |
| Frontend params | `page.tsx` `fetchProducts()` | Sends `page`, `limit`, `search`, `category`, `sku`, `minPrice`, `maxPrice`, `sort`; **no stock** | Add `stock` param when `stockFilter !== 'all'`; map UI values to API values |
| Frontend post-processing | `page.tsx` | Client-filters `response.data` by stock after fetch | **Remove** client-side stock filter block (lines 170–187) |
| Route query parsing | `apps/web/app/api/v1/admin/products/route.ts` | `validateAndNormalizeFilters()` — no stock param | Parse `stock` query param; validate allowed values; pass to service |
| Filter type | `admin-products-read/types.ts` | `ProductFilters` has no stock field | Add `stock?: 'in_stock' \| 'out_of_stock'` (omit/`all` = no filter) |
| Where clause builder | `query-builder.ts` | `deletedAt: null` + search/category OR + optional SKU `variants.some` | Add stock conditions via `where.AND` to avoid overwriting SKU `variants` filter |
| Query executor | `query-executor.ts` | `findMany({ where, skip, take, orderBy })` + `count({ where })` — same `where` | No structural change if `where` includes stock |
| Formatter | `product-formatter.ts` | Returns `stock` from one variant; `colorStocks: []` | **Optional** later improvement; not required for filter correctness |
| Response shape | `product-operations.ts` | `{ data, meta: { total, page, limit, totalPages } }` | Unchanged |

### API flow detail (Step 2 answers)

| # | Question | Answer |
| - | -------- | ------ |
| 1 | Route handler | `apps/web/app/api/v1/admin/products/route.ts` — `GET` |
| 2 | Query params parsed | `validateAndNormalizeFilters(searchParams)` in same file |
| 3 | Filter interface | `ProductFilters` in `admin-products-read/types.ts` |
| 4 | Stock param accepted? | **No** |
| 5 | Validation/normalization | Page, limit, min/max price, category, search, sku, sort — no stock |
| 6 | Prisma `where` built | `buildProductWhereClause()` in `query-builder.ts` |
| 7 | Pagination | `product-operations.ts`: `skip = (page-1)*limit`, `take = limit` → `executeProductListQuery` |
| 8 | Count | `db.product.count({ where })` in `query-executor.ts` — same `where` as list |
| 9 | Sorting | Server: `buildProductOrderByClause()` for `createdAt-*`; client-side sort in `page.tsx` for `title`/`price` |
| 10 | Formatting | `products.map(formatProductForList)` in `product-operations.ts` |
| 11 | Response shape | `{ data: Product[], meta: { total, page, limit, totalPages } }` |
| 12 | Stock fields in response | `stock: number` (single variant), `colorStocks: []` |

---

## 5. Recommended Stock Semantics

### Recommended rule (based on schema + existing storefront patterns)

| Filter | Rule |
| ------ | ---- |
| `in_stock` | Product has **at least one `ProductVariant` with `published: true` AND `stock > 0`** |
| `out_of_stock` | Product has **no** variant with `published: true` AND `stock > 0` |
| `all` | No stock filter |

**Prisma sketch (relation name confirmed: `variants`):**

```ts
// in_stock
{ variants: { some: { published: true, stock: { gt: 0 } } } }

// out_of_stock
{ variants: { none: { published: true, stock: { gt: 0 } } } }
```

**Rationale:**

- `ProductVariant.published` exists and is used elsewhere for sellability (`/api/v1/products/variants/[id]`).
- Admin list include already scopes to `published: true` variants for display.
- Aligns with business rule “sellable variant” when no other active/enabled flags exist.

**Alternative (owner decision):** For admin inventory management, count **all variants** regardless of `published`. That would surface products where only draft variants hold stock. Document if admins need that view.

### Edge cases

| Case | Recommended treatment |
| ---- | --------------------- |
| Products with zero variants | **Out of stock** (`none` matches — no variant with stock > 0) |
| Nullable stock | N/A — field is non-null `Int`, defaults to `0` |
| Negative stock | Treat as **out of stock** (`stock > 0` check fails). Admin create validation rejects negative input |
| Unpublished variants with stock | **Excluded** from in-stock count when using `published: true` filter |
| `stockReserved` | **Ignore for list filter** — use gross `stock` field (consistent with cart/checkout checks on `variant.stock`) |

### UI ↔ API value mapping

| UI value (`stockFilter`) | API query param (`stock`) |
| ------------------------ | --------------------------- |
| `all` | omit param |
| `inStock` | `in_stock` |
| `outOfStock` | `out_of_stock` |

Keep camelCase in React state; use snake_case in API query string (matches existing params like `minPrice` camelCase — note existing API uses camelCase for price; either `stock=in_stock` snake or `stock=inStock` camel is fine if consistent). **Recommendation:** `stock=in_stock|out_of_stock` for clarity and to match Phase 1B spec.

---

## 6. Minimal Safe Fix Plan

Do not implement until owner approves this report.

| Step | File | Change | Risk |
| ---- | ---- | ------ | ---- |
| 1 | `admin-products-read/types.ts` | Add `stock?: 'in_stock' \| 'out_of_stock'` to `ProductFilters` | Low |
| 2 | `route.ts` | Read `stock` from query; validate enum; include in filters object | Low |
| 3 | `query-builder.ts` | Add `applyStockFilter(where, filters.stock)` using `where.AND` push pattern; merge safely with existing `variants.some` SKU filter | **Medium** — must not overwrite `where.variants` |
| 4 | `product-operations.ts` | No logic change if `where` is complete | None |
| 5 | `page.tsx` | Map `stockFilter` → `params.stock`; remove client-side filter block (lines 170–187); keep `stockFilter` in `useEffect` deps | Low |
| 6 | `product-formatter.ts` | **Optional Phase 1B+** — improve `stock`/`colorStocks` accuracy for future UI | Low priority |

### Query-builder merge strategy (SKU + stock)

Current SKU filter assigns `where.variants = { some: { sku: ... } }`. Stock filter must not replace it.

**Safe pattern:**

```ts
const andConditions: Prisma.ProductWhereInput[] = [];

if (filters.sku) {
  andConditions.push({ variants: { some: { sku: { contains: filters.sku, mode: 'insensitive' } } } });
}

if (filters.stock === 'in_stock') {
  andConditions.push({ variants: { some: { published: true, stock: { gt: 0 } } } });
} else if (filters.stock === 'out_of_stock') {
  andConditions.push({ variants: { none: { published: true, stock: { gt: 0 } } } });
}

if (andConditions.length > 0) {
  where.AND = [...(where.AND ?? []), ...andConditions];
}
```

Remove standalone `where.variants = ...` for SKU when refactoring.

### DB query strategy answers (Step 4)

| # | Question | Answer |
| - | -------- | ------ |
| 1 | Can Prisma express this with relation filters? | **Yes** — `variants.some` / `variants.none` |
| 2 | Does query-builder use `where.AND`? | **Not currently** — only `where.OR` and direct `where.variants` |
| 3 | Compatible with category/search/SKU? | **Yes** with AND merge; search/category OR logic is pre-existing |
| 4 | Compatible with count query? | **Yes** — same `where` passed to `count` |
| 5 | Count uses same where as list? | **Yes** — `executeProductListQuery` |
| 6 | Sorting still works? | Server sort unchanged; client title/price sort still page-local (pre-existing limitation) |
| 7 | Indexes needed? | No index on `ProductVariant.stock` today (`@@index([productId])` only). Large catalogs may benefit from composite index — **document only, no migration in Phase 1B** |
| 8 | Raw SQL needed? | **No** — Prisma relation filters sufficient |
| 9 | Response shape unchanged? | **Yes** |

---

## 7. Risks

| Risk | Why It Matters | Mitigation |
| ---- | -------------- | ---------- |
| Multi-variant products | Client filter used single-variant `stock`; wrong classifications today | Server filter uses `some`/`none` across all matching variants |
| Products with zero variants | Ambiguous in UI | Treat as out of stock via `none` |
| Unpublished variant holds all stock | Product shows out of stock with `published: true` rule | Confirm owner wants sellable-only semantics; document alternative |
| Count mismatch | Separate where clauses would break pagination | Single `buildProductWhereClause` output for both list and count |
| Prisma relation filter mistakes | Overwriting `where.variants` breaks SKU+stock combo | Use `where.AND` array |
| Performance without indexes | `variants.some/none` subqueries on large tables | Monitor; note future index `(productId, published, stock)` — no migration now |
| UI labels vs API values | `inStock` vs `in_stock` | Explicit map in `fetchProducts()` only |
| Phase 1A uncommitted overlap | `page.tsx` already dirty | Commit Phase 1A first or apply Phase 1B as separate focused diff |
| Client sort + server stock filter | Title/price sort still only sorts current page | Pre-existing; out of Phase 1B scope unless owner expands |
| Selected rows after filter change | Stale `selectedIds` may reference products not on screen | Pre-existing; optional clear on filter change — out of scope unless requested |

---

## 8. Test Checklist

### Automated

- [ ] `npm run lint --workspace=@shop/web`
- [ ] `npm run build --workspace=@shop/web`

### Manual

- [ ] Open `/admin/products`
- [ ] Select “all products” stock filter
- [ ] Select “in stock”
- [ ] Select “out of stock”
- [ ] Verify API request includes `stock` param when needed (DevTools → Network)
- [ ] Verify API request **does not** include `stock` param for “all products”
- [ ] Verify results match DB/known products (including multi-variant product where cheapest variant is OOS but another variant has stock)
- [ ] Verify pagination `total` / `totalPages` changes with stock filter
- [ ] Verify page 2 with stock filter preserves `stock` param
- [ ] Verify changing stock filter resets page to 1
- [ ] Verify title search + stock filter work together
- [ ] Verify SKU search + stock filter work together
- [ ] Verify category filter + stock filter work together
- [ ] Verify sort still works (note: title/price sort is page-local)
- [ ] Verify clear filters resets stock filter and page
- [ ] Verify no changes to product create/edit flows

---

## 9. Final Recommendation

| Question                             | Answer   |
| ------------------------------------ | -------- |
| Is Phase 1B safe to implement now?   | **YES**, after owner confirms stock semantics and Phase 1A is committed separately |
| What owner decision is still needed? | (1) Use **`published: true`** variants only vs **all variants** for stock filter. (2) Approve API param values `in_stock` / `out_of_stock`. (3) Confirm Phase 1A should be committed before Phase 1B. |
| Exact stock rule to implement        | **`in_stock`:** ≥1 variant with `published: true` AND `stock > 0`. **`out_of_stock`:** no such variant (includes zero-variant products). |
| Files to change                      | `page.tsx`, `route.ts`, `admin-products-read/types.ts`, `query-builder.ts` |
| Files not to touch                   | `add/**`, create/edit flows, variant CRUD, schema/migrations, `product-formatter.ts` (optional only), `ProductCard`, public catalog, Meilisearch, Redis, checkout/cart/orders/auth, `query-executor.ts` (unless needed — no change expected) |

---

## Appendix: Frontend changes detail (Step 5)

| # | Question | Answer |
| - | -------- | ------ |
| 1 | Stock param name | `stock` |
| 2 | UI → API mapping | `all` → omit; `inStock` → `in_stock`; `outOfStock` → `out_of_stock` |
| 3 | Stop client-side filtering? | **Yes** — remove lines 170–187 in `page.tsx` |
| 4 | Keep `stockFilter` in `useEffect` deps? | **Yes** — changing filter must refetch |
| 5 | Include stock only when not `all`? | **Yes** |
| 6 | Pagination reset on stock change? | **Already yes** — `ProductFilters.tsx:172` |
| 7 | Trust server `meta` after fix? | **Yes** |
| 8 | Sorting with filtered results? | Server `createdAt` sort is global; client `title`/`price` sort remains page-local (pre-existing) |
