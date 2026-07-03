# Phase 5D Color / Size Filter Debug

**Phase type:** DEBUG / AUDIT ONLY — no production code changed.

---

## Git state

| Item | Value |
|------|-------|
| **Branch** | `dev-Karo` |
| **Tracking** | Up to date with `origin/dev-Karo` |
| **Latest commits** | `40d6df0` perf(products): use lightweight catalog listing query · `f16dee1` perf(products): move price and brand filters to database · `7b46777` perf(products): paginate catalog queries in database · `a6eccea` perf: enable next image optimization |
| **Local debug files** | Pre-existing untracked: `PHASE_1A_DEBOUNCE_DEBUG.md`, `PHASE_1A_VERIFICATION.md`, `PHASE_1B_STOCK_FILTER_DEBUG.md`, `PHASE_4_PRODUCTS_CATALOG_DEBUG.md`; modified: `PHASE_1_DEBUG_STATUS.md` (pre-existing, untouched this phase) |
| **Production code changed** | **no** |

---

## Files inspected

| File | Purpose | Relevant findings |
|------|---------|-------------------|
| `apps/web/app/api/v1/products/route.ts` | Public catalog API | Parses `colors` and `sizes` as raw comma-separated strings; default `lang=en` |
| `apps/web/app/api/v1/products/filters/route.ts` | Facet API for filter UI | Does not accept `colors`/`sizes` params; returns available color/size options |
| `apps/web/lib/services/products-find.service.ts` | Orchestration | `canUseDbPagination()` → legacy over-fetch path when `colors` or `sizes` present |
| `apps/web/lib/services/products-find-query/query-builder.ts` | Prisma `where` | Price + brand in DB; **no color/size in `buildWhereClause`**; `canUseDbPagination` blocks DB pagination if colors/sizes set |
| `apps/web/lib/services/products-find-query/query-executor.ts` | Legacy fetch | Includes `variants: { where: { published: true }, include: { options: { include: { attributeValue… } } } } }` |
| `apps/web/lib/services/products-find-query/listing-select.ts` | Phase 5C listing select | Published variants only; options include `attributeKey`, `value`, nested `attributeValue` + translations |
| `apps/web/lib/services/products-find-filter.service.ts` | In-memory filters | **Only place color/size filtering happens today** |
| `apps/web/lib/services/products-find-transform.service.ts` | Legacy listing transformer | Builds `colors[]` from variant options; **no `sizes` in API output** |
| `apps/web/lib/services/products-find-listing-transform.service.ts` | DB-paginated transformer | Same color collection logic; **no `sizes` in API output** |
| `apps/web/lib/services/products-filters.service.ts` | Facet aggregation | Scans all products/variants/options in memory; defines canonical filter `value` format |
| `apps/web/components/ColorFilter.tsx` | UI (orphan) | Sends lowercase `color.value` in `colors=` URL param |
| `apps/web/components/SizeFilter.tsx` | UI (orphan) | Sends uppercase `size.value` in `sizes=` URL param |
| `apps/web/app/(main)/products/page.tsx` | Shop page | Parses `colors`/`sizes` from URL into `ProductFilters` |
| `packages/db/prisma/schema.prisma` | DB schema | Relation path for variant options documented below |

---

## Current query params

| Param | Format | Parsed where | Notes |
|-------|--------|--------------|-------|
| `colors` | Comma-separated string, e.g. `red` or `red,blue` | `route.ts` → `searchParams.get("colors")` → `ProductFilters.colors` → `normalizeFilterList(colors, v => v.toLowerCase())` in `filterProducts` | Not in Prisma `where`. Triggers legacy path via `canUseDbPagination`. Placeholder tokens `undefined`, `null`, empty dropped. |
| `sizes` | Comma-separated string, e.g. `M` or `M,L` | Same chain → `normalizeFilterList(sizes, v => v.toUpperCase())` | Not in Prisma `where`. Triggers legacy path. Same placeholder handling. |
| `lang` | Locale string | Affects which `attributeValue.translations` label is preferred when matching | API default `en`; filter helpers fall back to `'ru'` only if `filters.lang` is falsy (route always sets a lang). |

---

## Current in-memory color filter semantics

### Exact code path

1. `GET /api/v1/products?colors=…` → `productsService.findAll` → `canUseDbPagination` **false** → `buildQueryAndFetch` (over-fetch `limit×10`) → `filterProducts`.
2. `filterProducts` lines 65–148 in `products-find-filter.service.ts`.

### Value type matched

- Filter param values: **lowercase strings** after `normalizeFilterList`.
- Variant option values resolved by `getColorValue(opt, filters.lang || 'ru')`:
  - **New format:** `opt.attributeValue.attribute.key === "color"` → `(translation.label \|\| attributeValue.value).trim().toLowerCase()` using locale match on `filters.lang`, else first translation.
  - **Old format:** `attributeKey/key/attribute === "color"` → `(opt.value \|\| opt.label).trim().toLowerCase()`.

### Relation source

`product.variants[].options[]` — either `option.attributeValue` (with `attribute.key`, `value`, `translations`) or legacy flat `attributeKey` + `value`.

### Published variant behavior

DB fetch (`query-executor.ts`) already restricts to `variants: { where: { published: true } }`. In-memory filter only sees published variants.

### Multiple values behavior

- `colors=red,blue` → **OR** among listed colors on a single variant (any one matching color option suffices).
- Between color and size when both present → **AND** (see combination section).
- Values: split on `,`, trimmed, lowercased; invalid tokens removed.
- URL decoding handled by Next.js `searchParams` (e.g. `%20` → space, then trimmed).

### Case sensitivity

Filter params lowercased; variant values lowercased before compare. Case-insensitive in practice.

### Examples (dev DB)

| Request | Result |
|---------|--------|
| `colors=red` | `total=0` |
| `colors=red,blue` | `total=0` |
| `colors= Red , Blue` | `total=0` (trimmed/lowercased, still no matches) |
| `colors=undefined` | `total=94` — token dropped, **no color filter applied**, but legacy path still forced (see risk) |

---

## Current in-memory size filter semantics

### Exact code path

Same legacy path as colors; `getSizeValue` in `filterProducts` lines 99–141.

### Value type matched

- Filter param values: **uppercase strings** after `normalizeFilterList`.
- Variant option values:
  - **New format:** `attribute.key === "size"` → `(translation.label \|\| attributeValue.value).trim().toUpperCase()`.
  - **Old format:** `attributeKey/key/attribute === "size"` → `(opt.value \|\| opt.label).trim().toUpperCase()`.

### Relation source

Same `variants[].options[]` path as colors.

### Published variant behavior

Same — only published variants loaded from DB.

### Multiple values behavior

- `sizes=M,L` → **OR** among listed sizes on a single variant.
- Split on `,`, trimmed, uppercased.

### Case sensitivity

Filter params uppercased; variant values uppercased. Case-insensitive for Latin letters in practice.

### Examples (dev DB)

| Request | Result |
|---------|--------|
| `sizes=M` | `total=0` |
| `sizes=M,L` | `total=0` |

---

## Color + size combination semantics

### Same variant or same product?

**Same variant required.**

Evidence (`products-find-filter.service.ts`):

```typescript
const matchingVariants = variants.filter((variant) => {
  // … per variant …
  if (colorList.length > 0) { /* any option on THIS variant matches any requested color */ }
  if (sizeList.length > 0) { /* any option on THIS variant matches any requested size */ }
  return true;
});
return matchingVariants.length > 0;
```

A product passes only if **at least one published variant** has:
- (if colors requested) a color option matching **any** requested color, **and**
- (if sizes requested) a size option matching **any** requested size.

Color and size may come from **different options on the same variant** (typical: one option row per attribute). It does **not** allow color on variant A and size on variant B of the same product.

### Exact current behavior

| Filters | Semantics |
|---------|-----------|
| `colors` only | Product has ≥1 published variant with a matching color option |
| `sizes` only | Product has ≥1 published variant with a matching size option |
| `colors` + `sizes` | Product has ≥1 published variant satisfying **both** (same variant) |
| Multi color | OR within colors |
| Multi size | OR within sizes |
| Color condition ∧ size condition | AND across attribute types |

---

## Transformer vs filter field alignment

| Aspect | Filter (`filterProducts`) | Transformer (listing / legacy) | Facet API (`getFilters`) | UI sends |
|--------|----------------------------|--------------------------------|--------------------------|----------|
| Color identity | `translation.label \|\| attributeValue.value` (lowercased) | Same sources; output preserves display casing in `colors[].value` | Facet `value` = **lowercase key**; `label` = display | Lowercase `color.value` from facets |
| Size identity | `translation.label \|\| attributeValue.value` (uppercased) | **Not exposed in listing API** | Facet `value` = **uppercase** | Uppercase `size.value` from facets |
| Old format | `attributeKey` + `value`/`label` | Same | Same | N/A in dev DB |
| Locale | `filters.lang` (prefer matching translation) | Same | Same | `getStoredLanguage()` for facet fetch |

**Alignment:** Filter and facet `value` formats are designed to match (lowercase color keys, uppercase size keys). Transformer uses the same resolution sources but listing response only includes `colors`, not `sizes`.

**Mismatch risk:** Facet API default `lang` in route is `en`; `getFilters` internal fallback uses `'ru'` when building labels. Filter uses `filters.lang` from request. Must keep locale consistent when implementing DB `where`.

---

## API / DB data findings

### Are colors present in API output?

- **DB-paginated path** (`/api/v1/products?page=1&limit=100`): all 94 products return `"colors": []`.
- **Legacy path** (when `colors` param forces it): same — no color data on dev catalog (food/menu items).

### Are sizes present in listing response?

**No.** Neither `products-find-transform.service.ts` nor `products-find-listing-transform.service.ts` adds a `sizes` field. Sizes exist only as filter input, not filter output.

### Does dev DB contain color/size data?

**No observable data in running dev environment:**

| Source | Finding |
|--------|---------|
| `GET /api/v1/products/filters?lang=ru` | `colors: []`, `sizes: []` |
| Product detail `GET /api/v1/products/matsun-sousy` | 1 variant, `options: []` |
| Listing sample (20 products) | All `colors: []` |

Direct Prisma CLI query failed locally (`DATABASE_URL` not set in shell); conclusions from live API against dev server DB.

### Actual values found

None in dev DB.

### Placeholder tests result

| URL | Status | `meta.total` | Notes |
|-----|--------|--------------|-------|
| `…&colors=red` | 200 | 0 | Legacy path |
| `…&sizes=M` | 200 | 0 | Legacy path |
| `…&colors=red&sizes=M` | 200 | 0 | Legacy path |
| `…&colors=red,blue` | 200 | 0 | Multi-color OR |
| `…&sizes=M,L` | 200 | 0 | Multi-size OR |
| `…&colors=undefined` | 200 | 94 | Placeholder stripped; **legacy path still used** |

---

## Published variant semantics

| Question | Answer |
|----------|--------|
| Unpublished variants in DB query? | **No** — `query-executor.ts` and `listing-select.ts` use `variants: { where: { published: true } }` |
| Unpublished variants before in-memory filter? | **Filtered out at query** — in-memory filter never sees them |
| Color/size filter uses published only? | **Yes** (inherits query include) |
| Phase 5C listing select published only? | **Yes** — `listing-select.ts` line 134 |
| Should DB `where` use `published: true`? | **Yes** — must match current semantics |

---

## Prisma schema relation path

```
Product
  └── variants[]          (ProductVariant, field: variants)
        └── options[]     (ProductVariantOption, field: options)
              ├── attributeKey   String?   (legacy: "color" | "size")
              ├── value            String?   (legacy flat value)
              └── attributeValue   AttributeValue?  (via valueId → valueId)
                    ├── value      String
                    ├── imageUrl   String?
                    ├── colors     Json?
                    ├── translations[]  AttributeValueTranslation (locale, label)
                    └── attribute    Attribute
                          └── key    String  ("color" | "size" | …)
```

**Fields needed for DB filter implementation:**
- `ProductVariant.published`
- `ProductVariantOption.attributeKey`, `ProductVariantOption.value`
- `AttributeValue.value`, `AttributeValue.id`
- `AttributeValueTranslation.label`, `AttributeValueTranslation.locale`
- `Attribute.key`

**No slug field** on `AttributeValue` — matching must use `value`, `translations.label`, or `valueId` (if UI ever sends IDs; currently it sends normalized label/value strings).

---

## Proposed DB `where` for implementation

> Design only — **do not implement in this phase.**

Helper: resolve a color token (already lowercased) or size token (already uppercased) to a Prisma `ProductVariantOptionWhereInput`.

```typescript
function buildColorOptionMatch(tokenLower: string, lang: string): Prisma.ProductVariantOptionWhereInput {
  return {
    OR: [
      // New format
      {
        attributeValue: {
          attribute: { key: "color" },
          OR: [
            { value: { equals: tokenLower, mode: "insensitive" } },
            {
              translations: {
                some: {
                  locale: lang,
                  label: { equals: tokenLower, mode: "insensitive" },
                },
              },
            },
            {
              translations: {
                some: {
                  label: { equals: tokenLower, mode: "insensitive" },
                },
              },
            },
          ],
        },
      },
      // Legacy format
      {
        attributeKey: "color",
        value: { equals: tokenLower, mode: "insensitive" },
      },
    ],
  };
}

function buildSizeOptionMatch(tokenUpper: string, lang: string): Prisma.ProductVariantOptionWhereInput {
  return {
    OR: [
      {
        attributeValue: {
          attribute: { key: "size" },
          OR: [
            { value: { equals: tokenUpper, mode: "insensitive" } },
            {
              translations: {
                some: {
                  locale: lang,
                  label: { equals: tokenUpper, mode: "insensitive" },
                },
              },
            },
            {
              translations: {
                some: {
                  label: { equals: tokenUpper, mode: "insensitive" },
                },
              },
            },
          ],
        },
      },
      {
        attributeKey: "size",
        value: { equals: tokenUpper, mode: "insensitive" },
      },
    ],
  };
}
```

### Color only

```typescript
andConditions.push({
  variants: {
    some: {
      published: true,
      options: {
        some: {
          OR: colorTokens.map((t) => buildColorOptionMatch(t, lang)),
        },
      },
    },
  },
});
```

### Size only

```typescript
andConditions.push({
  variants: {
    some: {
      published: true,
      options: {
        some: {
          OR: sizeTokens.map((t) => buildSizeOptionMatch(t, lang)),
        },
      },
    },
  },
});
```

### Color + size (same variant — critical)

Use **one** `variants.some` with **two** `options.some` under `AND`:

```typescript
andConditions.push({
  variants: {
    some: {
      published: true,
      AND: [
        {
          options: {
            some: {
              OR: colorTokens.map((t) => buildColorOptionMatch(t, lang)),
            },
          },
        },
        {
          options: {
            some: {
              OR: sizeTokens.map((t) => buildSizeOptionMatch(t, lang)),
            },
          },
        },
      ],
    },
  },
});
```

**Do not** use two separate top-level `variants.some` (that would mean same product, different variants).

### Multi color / multi size

- Multiple colors → `OR` inside single `options.some` (shown above).
- Multiple sizes → `OR` inside single `options.some`.
- Combined with price/brand/category/search → append to existing `extraConditions` / `AND` array in `buildWhereClause`, same pattern as Phase 5B.

### `canUseDbPagination` update (future)

After DB filters exist, remove `colors`/`sizes` from the opt-out list so color/size requests can use DB pagination + listing select.

### Token parsing (future)

Reuse `normalizeFilterList` logic from `products-find-filter.service.ts` (or extract shared helper) in `query-builder.ts` for parity.

---

## Risk assessment

| Risk | Level | Detail |
|------|-------|--------|
| **Implementation risk** | Medium | Same-variant `AND` is easy to get wrong with multiple `variants.some`; locale + legacy/new dual format adds query complexity |
| **Data verification risk** | **High** | Dev DB has **zero** color/size variant options — cannot validate filter correctness end-to-end locally |
| **Behavior mismatch risk** | Medium | `colors=undefined` forces legacy path but applies no filter; lang defaults differ across route/facet/filter fallbacks |
| **UI integration risk** | Low–Medium | `ColorFilter` / `SizeFilter` exist but are **not imported anywhere** in the repo; shop page only reads URL params |

### Is Phase 5D implementation safe now?

**No.**

---

## Recommended implementation plan

### Preconditions (must complete before coding)

1. Seed or import **≥1 product** with published variants that have both color and size options (new `attributeValue` format and, if supported, legacy `attributeKey` format).
2. Capture golden test vectors from facet API: exact `colors=` / `sizes=` strings the UI would send.
3. Document expected `meta.total` for: color-only, size-only, combined, multi-value OR cases.

### If preconditions met — files to change

| File | Change |
|------|--------|
| `apps/web/lib/services/products-find-query/query-builder.ts` | Add `buildColorFilter`, `buildSizeFilter`, integrate into `buildWhereClause`; update `canUseDbPagination` |
| `apps/web/lib/services/products-find-filter.service.ts` | Remove color/size blocks (keep sort/bestseller if still needed on legacy path) |
| Optional shared util | Extract `normalizeFilterList` + token parsers to avoid drift |

### Functions to update

- `canUseDbPagination()`
- `buildWhereClause()`
- `filterProducts()` — strip color/size after DB migration

### Tests to run (manual)

1. Facet API returns non-empty colors/sizes for seeded data.
2. `colors=<facetValue>` returns products whose listing `colors[].value` normalizes to same key.
3. `sizes=<facetValue>` returns products with matching variant options (verify via PDP options).
4. `colors=X&sizes=Y` returns only products with a **single variant** carrying both.
5. `colors=a,b` OR semantics.
6. Combined with `minPrice`, `brand`, `category`, `search`.
7. `lang=hy|ru|en` label matching.
8. Regression: requests **without** colors/sizes still use DB pagination (Phase 5A/5C path).
9. Edge: `colors=undefined` should not force legacy path after fix.

### Suggested commit message (when implemented)

```
perf(products): move color and size filters to database where clause
```

---

## Stop conditions for implementation

Do **not** proceed with Phase 5D implementation if:

1. No staging/dev data with real color/size variant options to validate against.
2. Same-variant vs same-product semantics is not explicitly signed off (must be **same variant** per current code).
3. Facet `value` format and filter `where` matching rules are not aligned (lowercase colors, uppercase sizes, translation vs raw value).
4. `canUseDbPagination` is not updated — otherwise color/size requests keep paying `limit×10` over-fetch despite DB `where`.
5. `colors=undefined`-style placeholder handling is not resolved (legacy path leak).
6. Locale strategy is not unified (`lang` param vs stored language vs translation fallback order).

---

## Summary

| Topic | Finding |
|-------|---------|
| **Color param** | Comma-separated; lowercased; OR within list; matched against variant option label/value |
| **Size param** | Comma-separated; uppercased; OR within list; matched against variant option label/value |
| **Value type** | Normalized display strings (not IDs, not slugs, not hex) |
| **Same variant vs product** | **Same variant** (both attributes on one variant) |
| **Published variants** | Yes — only `published: true` variants in query and filter |
| **Multi-value** | OR within type; AND between color and size |
| **Dev data** | Empty — no colors/sizes in DB/API |
| **Safe to implement now** | **No** |

**Recommended next step:** Import or create catalog products with color/size variant options in dev/staging, record facet values and expected counts, then implement DB `where` in `query-builder.ts` preserving same-variant AND semantics.

**Implementation allowed:** **No** — blocked on verifiable color/size data and golden test vectors.
