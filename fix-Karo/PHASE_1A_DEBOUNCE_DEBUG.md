# Phase 1A Debounce Debug

**Date:** 2026-07-01  
**Scope:** Read-only investigation. No code was changed.  
**Observed request under review:**  
`/api/v1/admin/products?page=2&limit=20&search=supi&sort=createdAt-desc`

---

## 1. Current Implementation Summary

Phase 1A made three changes relevant to admin products search:

| Change | File | Effect |
| ------ | ---- | ------ |
| Debounced search values | `page.tsx` + new `useDebouncedValue.ts` | Raw `search` / `skuSearch` update immediately for inputs; API fetch uses `debouncedSearch` / `debouncedSkuSearch` after **300ms** idle |
| Fetch trigger | `page.tsx` `useEffect` deps | Uses `debouncedSearch` and `debouncedSkuSearch`, not raw values |
| API params | `fetchProducts()` | `params.search` and `params.sku` built from debounced values only |

**Not changed by Phase 1A:**

- Title search still does **not** call `setPage(1)` on `onChange` (same as pre-Phase-1A).
- SKU search still calls `setPage(1)` on every `onChange` (same as pre-Phase-1A).
- Title search still calls `setPage(1)` only via `handleSearch` on **Enter** (`useProductHandlers.ts`).
- Category, stock filter, clear-all, and header sort still reset page as before.
- `page` is **never debounced** — only search strings are.

---

## 2. Title Search Flow

Step-by-step when user types in the title field:

1. **User types** → `ProductFilters.tsx:65` `onChange` → `setSearch(e.target.value)`.
2. **State update** → `search` updates immediately; input stays responsive.
3. **Page update** → **No page update** on typing. `page` stays at its current value (e.g. `2`).
4. **Debounce update** → `useDebouncedValue(search, 300)` waits 300ms after last keystroke, then `debouncedSearch` updates.
5. **API request** → `useEffect` (deps include `debouncedSearch`, `page`, …) calls `fetchProducts()`:
   - `params.page = page.toString()` (current page, unchanged unless reset elsewhere)
   - `params.search = debouncedSearch.trim()` if non-empty

**Enter key path:**

1. User presses Enter → `ProductFilters.tsx:67–69` → `handleSearch(e)`.
2. `useProductHandlers.ts:29–31` → `e.preventDefault(); setPage(1);` only.
3. No direct fetch call; fetch runs when `useEffect` sees `page` change and/or `debouncedSearch` change.
4. If user presses Enter **before** 300ms debounce completes, first fetch may use `page=1` with **old** `debouncedSearch`; second fetch after debounce settles uses correct search.

**There is no search button** — only Enter triggers `handleSearch`.

---

## 3. SKU Search Flow

Step-by-step when user types in the SKU field:

1. **User types** → `ProductFilters.tsx:82–85` `onChange`.
2. **State update** → `setSkuSearch(e.target.value)` (immediate).
3. **Page update** → **`setPage(1)` on every keystroke** (immediate, not debounced).
4. **Debounce update** → `debouncedSkuSearch` updates 300ms after last keystroke.
5. **API request** → `useEffect` runs when `debouncedSkuSearch` and/or `page` change:
   - `params.page = page.toString()` → typically `"1"` because step 3 already reset page
   - `params.sku = debouncedSkuSearch.trim()` if non-empty

**Note:** Page resets immediately on first SKU keystroke; the network request is still delayed up to 300ms by debounce. Params use `page=1` + debounced SKU — **correct pattern**.

---

## 4. Observed Request Analysis

Request: `/api/v1/admin/products?page=2&limit=20&search=supi&sort=createdAt-desc`

### When is this correct?

**Correct** when the user:

1. Typed `supi` in the title field (or had it active),
2. Was on **page 1** with that search applied,
3. **Manually clicked page 2** in pagination (`ProductsTable` → `setPage(2)`).

Then `page=2`, `debouncedSearch=supi`, and the request is expected.

### When is this wrong?

**Wrong** when the user:

1. Was already on **page 2** (with no search, or a different search),
2. Typed a **new** title search `supi`,
3. Did **not** press Enter (so `setPage(1)` never ran).

Then `page` stays `2`, `debouncedSearch` becomes `supi` after 300ms → request is `page=2&search=supi`. Page 2 of a new result set may be empty or unrelated.

### Which code path likely produced it?

Most likely path for the **bug** scenario:

```
page.tsx:28-29   search / debouncedSearch
page.tsx:37      page = 2 (unchanged)
ProductFilters.tsx:65   setSearch only — no setPage(1)
page.tsx:130     useEffect deps: debouncedSearch changed
page.tsx:136-141 fetchProducts: page=2, search=supi
```

Alternative **correct** path:

```
User searched supi → debouncedSearch=supi, page=1
ProductsTable pagination → setPage(2)
page.tsx:130     useEffect: page changed
fetchProducts: page=2, search=supi
```

Code alone cannot distinguish these two without runtime context (pagination click vs typing from page 2).

---

## 5. Confirmed Problem or Not?

| Scenario | Expected Request | Current Behavior | Status |
| -------- | ---------------- | ---------------- | ------ |
| On page 2, type new title search | `page=1&search=...` | `page=2&search=...` (unless user presses Enter) | **BUG** |
| Search first, then click page 2 | `page=2&search=...` | `page=2&search=...` | **CORRECT** |
| On page 2, type SKU search | `page=1&sku=...` | `page=1&sku=...` (page reset immediate; fetch after debounce) | **CORRECT** |
| Clear search via "Clear all" | `page=1` without search | `setPage(1)` immediate; search cleared; fetch after 300ms debounce with no search | **CORRECT** |
| Clear title search manually (delete text, not "Clear all") | `page=1` without search | `page` unchanged; after debounce, fetch may use `page=2` with no search | **BUG** (pre-existing, same root cause) |
| Change category | `page=1&category=...` | `setPage(1)` on checkbox change | **CORRECT** |
| Change stock filter | Client filter only; page UI resets to 1 | `setPage(1)` on select change | **CORRECT** (page reset); stock still client-side |

### Direct answers to investigation questions

| # | Question | Answer |
| - | -------- | ------ |
| 1 | How does title search input update state? | `setSearch(e.target.value)` on every `onChange` (`ProductFilters.tsx:65`) |
| 2 | Does title search call `setPage(1)` when input changes? | **No** |
| 3 | Does title search only call `setPage(1)` on Enter? | **Yes** — via `handleSearch` → `setPage(1)` (`useProductHandlers.ts:29–31`). No search button exists |
| 4 | How does SKU search update state? | `setSkuSearch(e.target.value)` on every `onChange` |
| 5 | Does SKU search call `setPage(1)` on input change? | **Yes** — every keystroke (`ProductFilters.tsx:84`) |
| 6 | Which values build API params? | **Debounced:** `debouncedSearch`, `debouncedSkuSearch` (`page.tsx:140–149`) |
| 7 | Which values are in `useEffect` deps? | `page`, `debouncedSearch`, `debouncedSkuSearch`, `selectedCategories`, `stockFilter`, `sortBy`, `minPrice`, `maxPrice`, auth flags — **not** raw `search` / `skuSearch` |
| 8 | On page 2, type new title search — sequence? | `search` updates → `page` stays 2 → 300ms later `debouncedSearch` updates → `useEffect` → `fetchProducts` with `page=2&search=<new>` |
| 9 | Does debounce delay page reset or only search value? | **Only search value.** `page` is not debounced. Title search does not reset page on change anyway |
| 10 | Is `page=2&search=supi` expected in any scenario? | **Yes** — search first, then pagination to page 2 |
| 11 | Is `page=2&search=supi` a bug when typed from page 2? | **Yes** — confirmed by code |
| 12 | Does clearing search reset page correctly? | **"Clear all":** yes (`handleClearFilters` → `setPage(1)`). **Manual delete in input:** no page reset — likely wrong page |
| 13 | Does changing category reset page? | **Yes** — `setPage(1)` on checkbox (`ProductFilters.tsx:148`) |
| 14 | Does changing stock filter reset page? | **Yes** — `setPage(1)` on select change (`ProductFilters.tsx:169`) |
| 15 | Race between `setSearch`, `setPage(1)`, and debounce? | **Title:** Enter can set `page=1` before `debouncedSearch` catches up → transient fetch with stale search, then correct fetch. **Title without Enter:** no race — stable wrong page. **SKU:** `setPage(1)` immediate; fetch waits for debounced SKU — no page/search mismatch |

---

## 6. Minimal Fix Proposal (Do Not Implement)

**Confirmed bug:** title search does not reset pagination when the filter changes.

**Smallest safe fix** (align title search with SKU search):

In `ProductFilters.tsx`, title input `onChange`:

```tsx
onChange={(e) => {
  setSearch(e.target.value);
  setPage(1);
}}
```

Or equivalent handler in `page.tsx` passed as prop.

**Why this is sufficient:**

- Matches existing SKU pattern already in the same component.
- Keeps 300ms debounce on API params (no change to `useDebouncedValue` or effect deps).
- When user types on page 2: `page` → `1` immediately; after 300ms fetch uses `page=1&search=...`.
- When user searches then clicks page 2: pagination still sets `page=2`; debounced search unchanged → `page=2&search=...` remains correct.
- No API contract change.
- Does not touch stock filter, server logic, or Phase 1B scope.

**Optional hardening:** reset page when `debouncedSearch` / `debouncedSkuSearch` change via a dedicated `useEffect` — heavier and unnecessary if `onChange` reset matches SKU.

**Enter / `handleSearch`:** becomes redundant for pagination but harmless to keep.

---

## 7. Files That Would Need Change

If the minimal fix is approved:

| File | Change |
| ---- | ------ |
| `apps/web/app/(main)/admin/products/components/ProductFilters.tsx` | Add `setPage(1)` to title search `onChange` |

No changes required to:

- `page.tsx` (unless moving handler there for consistency)
- `useDebouncedValue.ts`
- `useProductHandlers.ts`
- API routes or server code

---

## 8. Test Checklist For Owner

Manual checks before/after any fix:

- [ ] Open `/admin/products`
- [ ] Go to **page 2** (no search active)
- [ ] Type a new title search (e.g. `supi`)
- [ ] **Network:** request must use `page=1&search=supi` (not `page=2`)
- [ ] From page 1, search `supi`, wait for results
- [ ] Click **page 2**
- [ ] **Network:** request may use `page=2&search=supi` — this is correct
- [ ] From page 2, type in **SKU** field
- [ ] **Network:** request must use `page=1&sku=...`
- [ ] Type quickly in title field — requests must **not** fire on every keystroke (~300ms debounce)
- [ ] Click **Clear all**
- [ ] **Network:** no `search`/`sku` param; `page=1`
- [ ] Manually delete title search text (without Clear all) from page 2
- [ ] **Network:** should use `page=1` without search (currently may fail — note result)
- [ ] Change category checkbox — request uses `page=1`
- [ ] Change stock filter — UI page resets to 1 (stock filter behavior unchanged)

---

## Summary

| Verdict | Detail |
| ------- | ------ |
| **`page=2&search=supi`** | **Expected** after search + manual pagination to page 2 |
| **`page=2&search=supi`** | **Confirmed bug** when user on page 2 types a new title search without Enter |
| **Phase 1A role** | Debounce reduced request frequency but **did not introduce** the pagination bug; title search never reset page on change |
| **Runtime testing** | Needed only to confirm *which user action* produced a specific Network tab URL — code paths for both correct and incorrect cases are identified |

**Recommendation:** Treat title-search pagination as a **confirmed bug** (code-level). Apply minimal fix: `setPage(1)` on title `onChange`, same as SKU. Do not implement until owner reviews this report.
