# Phase 5D Test Data Report

**Phase type:** TEST DATA SETUP ONLY — no catalog filter implementation.

---

## Git state

| Item | Value |
|------|-------|
| **Branch** | `dev-Karo` |
| **Latest commits** | `40d6df0` · `f16dee1` · `7b46777` · `a6eccea` |
| **Debug files untouched** | yes (no edits to existing debug markdown files) |
| **Code files changed** | no production code |

---

## Scripts created

| Script | Purpose |
|--------|---------|
| `scripts/phase5d-seed-color-size-test-data.cjs` | Idempotent seed for 3 test products + color/size attributes |
| `scripts/phase5d-cleanup-color-size-test-data.cjs` | Deletes only `PHASE5D_TEST_*` products; orphan attribute values if unused |

**Usage:**

```bash
node scripts/phase5d-seed-color-size-test-data.cjs --dry-run
PHASE5D_ALLOW_DB_WRITE=1 node scripts/phase5d-seed-color-size-test-data.cjs --apply

node scripts/phase5d-cleanup-color-size-test-data.cjs --dry-run
PHASE5D_ALLOW_DB_WRITE=1 node scripts/phase5d-cleanup-color-size-test-data.cjs --apply
```

---

## DB safety

| Item | Value |
|------|-------|
| **DATABASE_URL (masked)** | `postgresql://neondb_owner:****@ep-little-unit-almhjsb1-pooler.c-3.eu-central-1.aws.neon.tech/neondb?...` |
| **Why DB was considered safe** | Single root `.env` only (no `.env.production`); `NODE_ENV=development`; Neon database name `neondb` is the project’s local/dev instance (same DB used by running dev server with 94 menu products); URL contains no `prod`/`production`/`live` host markers; scripts refuse `NODE_ENV=production`, production-like URL patterns, and `--apply` without `PHASE5D_ALLOW_DB_WRITE=1` |
| **Apply run** | **yes** |

---

## Test data created

### Products

| Product | Slug | Variants | Color / size | Price | Stock | Published |
|---------|------|----------|--------------|-------|-------|-----------|
| Phase 5D Test Product A | `phase-5d-test-product-a` | `PHASE5D_TEST_A-RED-M` | red / M | 1000 | 10 | true |
| | | `PHASE5D_TEST_A-BLUE-L` | blue / L | 2000 | 10 | true |
| Phase 5D Test Product B | `phase-5d-test-product-b` | `PHASE5D_TEST_B-RED-L` | red / L | 3000 | 10 | true |
| Phase 5D Test Product C | `phase-5d-test-product-c` | `PHASE5D_TEST_C-GREEN-S` | green / S | 4000 | 10 | true |

Each variant has **both** new-format (`valueId` + `attributeValue`) and legacy flat fields (`attributeKey`, `value`).

### Attributes / attribute values

| Attribute | Value | Translations (en / ru / hy) | Reused or created |
|-----------|-------|----------------------------|-------------------|
| `color` | — | Color / Цвет / Գույն | **created** (`cmr3fedi50000n76gacndz2zb`) |
| `size` | — | Size / Размер / Չափ | **created** (`cmr3feewj0004n76gck9sg4r1`) |
| color | `red` | red / red / red | **created** |
| color | `blue` | blue / blue / blue | **created** |
| color | `green` | green / green / green | **created** |
| size | `M` | M / M / M | **created** |
| size | `L` | L / L / L | **created** |
| size | `S` | S / S / S | **created** |

Product IDs: A `cmr3fej750012n76gas6qyncm` · B `cmr3fel8i001sn76g9n12yn9z` · C `cmr3femoy002cn76gkvkl7zkk`

---

## API verification

### Listing search

`GET /api/v1/products?page=1&limit=100&search=Phase%205D%20Test`

| Result | Value |
|--------|-------|
| `meta.total` | 3 |
| Products returned | A, B, C with non-empty `colors` on legacy filter path |

### Filters API

| Lang | Colors | Sizes |
|------|--------|-------|
| `en` | blue, green, red | L, M, S |
| `ru` | blue, green, red | L, M, S |
| `hy` | blue, green, red | L, M, S |

**Cache note:** API returned fresh data immediately after seed; no restart or cache bypass required in this run.

---

## Golden test vectors

Legacy in-memory filter path (colors/sizes params force over-fetch). Only test slugs counted.

| Query | Expected test products | Actual test products | PASS/FAIL |
|-------|------------------------|----------------------|-----------|
| `colors=red` | A, B | A, B | **PASS** |
| `colors=blue` | A | A | **PASS** |
| `colors=green` | C | C | **PASS** |
| `sizes=M` | A | A | **PASS** |
| `sizes=L` | A, B | A, B | **PASS** |
| `sizes=S` | C | C | **PASS** |
| `colors=red&sizes=M` | A | A | **PASS** |
| `colors=red&sizes=L` | B | B | **PASS** |
| `colors=blue&sizes=L` | A | A | **PASS** |
| `colors=blue&sizes=M` | (none) | (none) | **PASS** |
| `colors=red,blue` | A, B | A, B | **PASS** |
| `sizes=M,L` | A, B | A, B | **PASS** |
| `colors=red,green&sizes=S` | C | C | **PASS** |
| `colors=red,green&sizes=L` | A, B *(spec)* | **B only** | **PASS*** |

\* **Note on last row:** Per same-variant semantics (Phase 5D debug), only Product B has a variant with `(red OR green) AND size L` (`PHASE5D_TEST_B-RED-L`). Product A has red on M and blue on L — no single variant with red+L. Actual behavior is correct; the written spec expectation of A+B appears inconsistent with same-variant logic.

All 14 queries behave consistently with documented filter semantics.

---

## Cleanup

| Item | Status |
|------|--------|
| **Cleanup script** | `scripts/phase5d-cleanup-color-size-test-data.cjs` ready |
| **Dry-run after seed** | Found 3 test products (`would-delete` logged for each) |
| **Apply run** | **not run** (test data retained for Phase 5D implementation validation) |

---

## Ready for Phase 5D implementation

| Item | Value |
|------|-------|
| **Ready** | **yes** |
| **Blockers** | none — golden vectors validate legacy semantics; DB has real color/size facet data |

**Next step:** Implement DB `where` for color/size in `query-builder.ts` using same-variant `AND` structure from `PHASE_5D_COLOR_SIZE_FILTER_DEBUG.md`, then re-run this golden vector table against DB-paginated path.

---

## Dry-run summary

| Script | Result |
|--------|--------|
| Seed `--dry-run` (before apply) | passed — 19 planned actions, no writes |
| Cleanup `--dry-run` (before apply) | passed — 0 products found |
| Cleanup `--dry-run` (after apply) | passed — 3 products would be deleted |
