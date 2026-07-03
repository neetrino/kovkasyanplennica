# /products Image 404 Deploy Debug

**Date:** 2026-07-03  
**Production URL:** https://kovkasyanplennica.vercel.app/products  
**Expected fix commit:** `5976f6c` — `fix(products): prevent optimized image 404s`

---

## Summary

| Question | Answer |
|----------|--------|
| Is `5976f6c` in git / on `main`? | **Yes** — merged via `da247ca` (PR #118) |
| Is fix pushed to origin? | **Yes** — on `origin/dev-Karo` and `origin/main` |
| Is production still broken? | **Yes** — local `/assets/optimized/menu/import/…` URLs and `_next/image` **404** |
| Is repo helper logic correct? | **Yes** — local tests pass; without env → originals; with env → full R2 optimized |
| Are R2 objects + manifest present? | **Yes** — sample keys **200** on R2; manifest has **88 entries / 96 keys** |
| Primary production cause | **Stale `unstable_cache` payloads** + **CategoryIcon uses cached URLs without re-transform**; possible **production not yet redeployed** to `da247ca` (manual Vercel check required) |

**Confidence:** High for git/code/R2/manifest; medium for exact Vercel deployment SHA (CLI not authenticated).

Production still serves **271** `_next/image?url=%2Fassets%2Foptimized…` references and **50** bare `/assets/optimized/menu/import` strings in HTML. The user-reported holodnye-zakuski URL still returns **HTTP 404** (79-byte body).

Partial fix signal: decorative `<img>` tags now use **full R2** `union-decorative-900w.webp` URLs (6 refs), not local paths — consistent with **runtime env present** and **page-level helper running fresh**, while **cached product/preview image fields** still hold pre-fix local optimized paths.

---

## Git / Branch Status

| Check | Result |
|-------|--------|
| Current branch | `dev-Karo` |
| Working tree | **Dirty** — 6 deleted doc files unstaged (not related to image fix) |
| `5976f6c` exists locally | **Yes** |
| Branches containing `5976f6c` | `dev-Karo`, `origin/dev-Karo`, `origin/main` |
| `main` contains `5976f6c` | **Yes** (`git merge-base --is-ancestor`) |
| Pushed to origin | **Yes** — `origin/dev-Karo` at `5976f6c`; `origin/main` at `da247ca` (merge commit includes fix) |

**Recent history:**

```
da247ca Merge pull request #118 from neetrino/dev-Karo   ← origin/main HEAD
5976f6c fix(products): prevent optimized image 404s
317c8e8 perf(products): optimize products page loading
e58c043 perf(products): use optimized images on products page
```

**Commit `5976f6c` stat:** 32 files — helper fallback, manifest expansion, catalog script, removal of 23 public optimized WebPs from git.

**Ruled out:** causes **A** (not pushed), **B** (not merged to main).

---

## Vercel Deployment Status

| Check | Result |
|-------|--------|
| `vercel.json` production branch | **Not specified** — defaults to project dashboard setting (typically `main`) |
| Vercel CLI deployment list | **Not available** — CLI not linked/authenticated (`vercel ls` failed) |
| Production HTML deployment id | `dpl_8Tyf7AnN4HpdDoqN1NicJTAvJg5X` (from `data-dpl-id` in HTML) |
| Production commit SHA | **Unknown — manual check required** |

**Manual Vercel dashboard check:**

Project → **Deployments** → latest **Production** → **Git Commit**  
Verify SHA is `da247ca` or `5976f6c` (or descendant).

**Inference from HTML (not definitive):**

- Decorative images use full R2 optimized URLs → code path with `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` + manifest (Phase 2A or 5976f6c).
- Product/sidebar images still use **local** optimized paths → behavior of **pre-5976f6c cached transforms** or **deploy still on `317c8e8` / earlier**.

**Verdict:** **Production may not have fix commit fully effective** — either **old deployment (4)** or **fix deployed but stale cache (11)**. Dashboard commit match is required to distinguish.

---

## Env Status

| Location | `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` |
|----------|----------------------------------|
| `.env` (local) | **Not found** in grep (may be unset or file absent in workspace) |
| `env/.env`, `env/.env.local` | **No files** |
| `.env.example` | **Documented** with example `https://pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev`, Vercel Production + Preview + redeploy note |
| Vercel Production | **Likely set** — decorative HTML uses full `pub-…r2.dev/assets/optimized/…` URLs |
| Trailing `/assets` misuse | **Not indicated** |
| Redeploy after env | **Unknown** |

**Important:** Even without env, **5976f6c** helpers must **not** emit local `/assets/optimized/menu/import/…` for catalog images (fallback to original R2 URL). Production still emits local paths → either **pre-5976f6c code path** or **cached serialized URLs** from before fix.

**Ruled out as sole cause:** **E** (env entirely missing) — decorative R2 URLs contradict total env absence at runtime.

**Still possible:** **F** — env added after last **build** (client bundle stale); server decorative reads runtime env while cached product payloads unchanged.

---

## Helper Output Tests

Run locally against **current repo** (`5976f6c` code) via temporary `tsx` script (not committed).

| Helper | Input | With env | Without env | Pass? |
|--------|-------|----------|-------------|-------|
| `toOptimizedDecorativeUrl` | `/assets/hero/union-decorative.png` | `https://pub-…r2.dev/assets/optimized/assets/hero/union-decorative-900w.webp` | `/assets/hero/union-decorative.png` | **Pass** |
| `toOptimizedProductCardUrl` | holodnye `.jpg` R2 URL | `https://pub-…r2.dev/assets/optimized/menu/import/holodnye-zakuski/…-400w.webp` | original `.jpg` R2 URL | **Pass** |
| `toOptimizedProductCardUrl` | brauni `.webp` R2 URL | full R2 `-400w.webp` | original `.webp` R2 URL | **Pass** |
| `toOptimizedProductCardUrl` | pasta `.jpg` R2 URL | full R2 `-400w.webp` | original `.jpg` R2 URL | **Pass** |
| `toOptimizedProductCardUrl` | local `/assets/optimized/…/brauni-400w.webp` | full R2 `-400w.webp` | original `.webp` R2 URL | **Pass** |

**Never** returns local `/assets/optimized/menu/import/…` when env is unset.

**Ruled out:** **G** (helper fallback broken in current code).

---

## Manifest Check

| Metric | Value |
|--------|-------|
| Manifest file | `apps/web/lib/image-optimization-manifest.json` |
| Loader | `apps/web/lib/image-optimization-manifest.ts` |
| Entries | **88** |
| Optimized output keys | **96** |

| Key | In manifest | R2 HEAD | Content-Type | Content-Length |
|-----|-------------|---------|--------------|----------------|
| `…/holodnye-zakuski-syrnaya-tarelka-evropei-cef199bd60-400w.webp` | **Yes** | **200** | image/webp | 97,532 |
| `…/pasta-pasta-rizotto-bc0879ace0-400w.webp` | **Yes** | **200** | image/webp | 41,906 |
| `…/garniry-kartofel-po-derevenski-c9fbfd0efb-400w.webp` | **Yes** | **200** | image/webp | 33,828 |
| `…/stei-ki-kurinyi-stei-k-s-syrnoi-nachinko-9bd5aa838c-400w.webp` | **Yes** | **200** | image/webp | 36,188 |
| `…/pitstsa-pitstsa-s-ohotnichimi-kolbaskami-164ddb000d-400w.webp` | **Yes** | **200** | image/webp | 103,214 |

**Ruled out:** **8** (manifest missing keys), **9** (R2 upload missing for audited keys).

If production ran **5976f6c** with env on a **cache miss**, these keys would resolve to full R2 URLs.

---

## R2 Existence Check

| Broken local URL (production) | Expected R2 URL | R2 status | Local Vercel status |
|------------------------------|-----------------|-----------|---------------------|
| `/assets/optimized/menu/import/holodnye-zakuski/…-400w.webp` | `https://pub-…r2.dev/assets/optimized/menu/import/holodnye-zakuski/…-400w.webp` | **200** | **404** |
| User `_next/image?url=%2Fassets%2Foptimized%2Fmenu%2Fimport%2Fholodnye-zakuski%2F…&w=96&q=75` | (same R2 object via correct URL) | N/A | **404** (79 B) |

**Conclusion:** Objects exist on R2; failure is **URL resolution / stale cached local paths**, not missing assets.

---

## Production HTML Check

Fetched `GET https://kovkasyanplennica.vercel.app/products` (336,244 bytes, 2026-07-03 ~17:12 UTC+4).

| Pattern | Count |
|---------|-------|
| `/assets/optimized/menu/import` | **50** |
| `pub-…r2.dev/assets/optimized` (all paths) | **6** (decorative only) |
| `pub-…r2.dev/assets/optimized/menu/import` | **0** |
| `pub-…r2.dev/menu/import` (original fallback) | **0** |
| `union-decorative.png` | **0** |
| `union-decorative-900w.webp` | **6** (full R2 URLs in `src`) |
| `-400w.webp` (any mention) | **625** |
| `_next/image?url=%2Fassets%2Foptimized` | **271** |
| Unique local `_next/image` menu/import URLs | **16** |

**Expected after 5976f6c + env on fresh render:**

- `local /assets/optimized/menu/import` → **0**
- Full R2 optimized menu/import → **>0**

**Actual:** Still matches **pre-fix / cached** behavior for catalog images.

---

## Network Check

| Class | Description | Observed |
|-------|-------------|----------|
| **A** | Full R2 optimized 200 | Decorative union (direct `<img>`); **not** seen for menu/import cards in HTML |
| **B** | Full R2 original fallback 200 | **0** in HTML (would appear if 5976f6c ran fresh without env) |
| **C** | Local `/assets/optimized` → `_next/image` **404** | **Yes** — user URL **404**, 79 B body |
| **D** | Other | UI chrome, logos |

| Metric | Value |
|--------|-------|
| Local optimized `_next/image` refs in HTML | **271** |
| Confirmed 404 (holodnye sample) | **Yes** |
| Full R2 optimized menu/import in HTML | **0** |
| Gray placeholders | Likely on sidebar/category thumbnails (`CategoryIcon` + cached preview URLs) |

**CategoryIcon** (`CategoryIcon.tsx`) uses `src={category.imageUrl || product?.image}` **directly** — no `toOptimizedProductCardUrl` at render time. Previews come from `getCategoryNavPreviews` → **`unstable_cache` key `category-nav-previews-v4`** (transform at cache write time).

---

## Root Cause Verdict

| Rank | Cause | Evidence |
|------|-------|----------|
| **1** | **11 — Stale cache / deployment confusion** | `unstable_cache` keys `main-products-list-v3` and `category-nav-previews-v4` store **pre-transformed** `image` URLs (TTL **3600s**). Populated under Phase 2A when helpers emitted local paths. CategoryIcon renders cached URLs **without** re-running helpers. |
| **2** | **4 — Production deploy uses old commit** (if dashboard SHA ≠ `da247ca`) | HTML still has local menu/import optimized paths despite fix in `main`. Decorative R2 URLs alone don't prove full fix deploy. **Verify in Vercel dashboard.** |
| **3** | **10 — Component path skips helper at render** | `CategoryIcon.tsx` uses cached preview `image` as-is → sidebar `_next/image` 404s even after helper fix. |
| **6** | **F — Env added but no full redeploy** (secondary) | Decorative uses runtime R2; client bundle may lack inlined `NEXT_PUBLIC_*` if build predates env. |

**Ruled out:**

| Cause | Why |
|-------|-----|
| 1–2 Not in production branch / not pushed | On `origin/main` via `da247ca` |
| 3 Wrong branch only | `main` contains fix |
| 5 Env entirely missing | Decorative full R2 URLs |
| 7 Helper broken in repo | Tests pass |
| 8–9 Manifest / R2 missing | All sample keys 200 |
| Hardcoded `/assets/optimized` in components | Only in scripts + helper key builders |

---

## Exact Next Steps

**Do not apply in this debug task** — recommended actions:

1. **Vercel dashboard:** Confirm Production deployment Git commit = `da247ca` or `5976f6c`. If older → **Redeploy** from `main`.

2. **Vercel env:** Confirm `NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev` on Production + Preview → **Redeploy** after any change.

3. **Purge stale caches** (fastest fix if deploy is current):
   - Bump `unstable_cache` keys (e.g. `main-products-list-v4`, `category-nav-previews-v5`) **or**
   - Call `revalidateTag('products-list')` / `revalidateTag('category-nav-previews')` **or**
   - Wait up to **3600s** for TTL expiry.

4. **Follow-up code hardening** (separate task): Run `toOptimizedProductCardUrl` in `CategoryIcon` (or store **raw** media URLs in cache and optimize at render) so cached payloads cannot bypass fallback logic.

5. **Verify after deploy + cache purge:**
   - HTML: `grep -c '/assets/optimized/menu/import'` → **0**
   - HTML: R2 optimized menu/import → **>0**
   - Network: no `_next/image?url=%2Fassets%2Foptimized…` **404**

---

## Code References (read-only)

| File | Role |
|------|------|
| `apps/web/lib/image-optimization.ts` | Manifest-gated fallback (5976f6c) |
| `apps/web/lib/image-optimization-manifest.ts` | Availability lookup |
| `apps/web/lib/services/products-find-listing-transform.service.ts` | Transform at cache write |
| `apps/web/lib/services/products-nav-preview.service.ts` | Preview transform + `category-nav-previews-v4` cache |
| `apps/web/app/(main)/products/page.tsx` | `main-products-list-v3` cache; fresh decorative helper |
| `apps/web/components/CategoryNavigation/CategoryIcon.tsx` | **No** re-transform on `src` |
| `apps/web/components/ProductCard/ProductCardGrid.tsx` | Re-runs helper (client SSR) |

**Grep `/assets/optimized` in `apps/web` (excl. scripts):** only `image-optimization.ts` constants/builders — **no component hardcoding**.
