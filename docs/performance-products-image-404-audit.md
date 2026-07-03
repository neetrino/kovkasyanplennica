# /products Image 404 Audit

**Date:** 2026-07-03  
**Production URL:** https://kovkasyanplennica.vercel.app/products  
**Branch deployed:** `dev-Karo` (Phase 2A–2E)  
**Scope:** DEBUG only — no code changes applied.

---

## Summary

| Metric | Value |
|--------|-------|
| Unique product `-400w.webp` paths in SSR HTML | **30** |
| Next/Image requests that return **200** | **3** (~10%) |
| Next/Image requests that return **404** (79-byte error body) | **27** (~90%) |
| Decorative `union-decorative-900w.webp` refs | **6** — all **200** (direct `<img>`, not Next/Image) |
| Full R2 optimized URLs in HTML | **0** |
| Local `/assets/optimized/` refs in HTML | **56** |
| `_next/image?url=%2Fassets%2Foptimized` refs | **575** |

**Main reason (dual):**

1. **`NEXT_PUBLIC_R2_PUBLIC_BASE_URL` is missing on Vercel Production** (and locally in repo `.env`). Image helpers emit **local** `/assets/optimized/...` paths instead of full R2 HTTPS URLs. Production HTML contains **zero** `pub-…r2.dev/assets/optimized/` strings — definitive proof the env var is empty at SSR/build time.

2. **Most catalog optimized WebPs were never generated or uploaded.** Phase 1 manifest covers only 3 homepage desserts + hero/gallery assets. **27 of 30** unique `-400w.webp` keys do not exist on Vercel `public/` **or** on R2. Original R2 images (e.g. holodnye-zakuski `.jpg`, brauni `.webp`, sousy `.webp`) **do** exist and would work if helpers fell back to them.

**Why some images still look “fine”:** Only the **3 Phase-1 dessert thumbnails** committed under `apps/web/public/assets/optimized/menu/import/deserty/` (krasnyi-barhat, medovik, muraveinik) plus **union-decorative-900w.webp** are physically present on the deployment. Everything else hits a missing local file → Next/Image 404 → gray placeholder (`ProductCardGrid` `onImageError`).

**Confidence:** **High** (HTML payload, curl HEAD matrix, helper reproduction, manifest inventory).

---

## Broken Image Examples

All broken product/category thumbnails follow pattern **C — local optimized via Next/Image**.

| Rendered src (Next/Image) | Decoded image URL | HTTP | Type | Size | Visible | Component | Likely reason |
|---------------------------|-------------------|------|------|------|---------|-----------|---------------|
| `/_next/image?url=%2Fassets%2Foptimized%2Fmenu%2Fimport%2Fdeserty%2Fdeserty-brauni-fd568152a9-400w.webp&w=256&q=75` | `/assets/optimized/menu/import/deserty/deserty-brauni-fd568152a9-400w.webp` | **404** | `text/plain` | 79 B | Broken (placeholder) | `ProductCardGrid` / `CategoryIcon` | Local file missing; R2 optimized **404**; original `.webp` on R2 **200** but never used |
| `/_next/image?url=%2Fassets%2Foptimized%2Fmenu%2Fimport%2Fholodnye-zakuski%2Fholodnye-zakuski-syrnaya-tarelka-evropei-cef199bd60-400w.webp&w=96&q=75` | `/assets/optimized/menu/import/holodnye-zakuski/...-400w.webp` | **404** | `text/plain` | 79 B | Broken | `CategoryIcon` (sidebar preview) | Local + R2 optimized **404**; original `.jpg` on R2 **200** (13.5 MB) |
| `/_next/image?url=%2Fassets%2Foptimized%2Fmenu%2Fimport%2Fpitstsa%2Fpitstsa-pitstsa-s-ohotnichimi-kolbaskami-164ddb000d-400w.webp&w=96&q=75` | `/assets/optimized/menu/import/pitstsa/...-400w.webp` | **404** | `text/plain` | 79 B | Broken | `CategoryIcon` | Local + R2 optimized **404**; not in Phase 1 manifest |
| `/_next/image?url=%2Fassets%2Foptimized%2Fmenu%2Fimport%2Fsousy%2Fsousy-sousy-3721c9b870-400w.webp&w=256&q=75` | `/assets/optimized/menu/import/sousy/...-400w.webp` | **404** | `text/plain` | 79 B | Broken | `ProductCardGrid` | Local + R2 optimized **404**; original `menu/import/sousy/...webp` on R2 **200** |

Next/Image 404 response headers (representative):

```
HTTP/1.1 404 Not Found
Content-Disposition: attachment; filename="deserty-brauni-fd568152a9-400w.bin"
Content-Length: 79
Content-Type: text/plain; charset=utf-8
```

---

## Visible Image Examples

| Rendered src | Decoded URL | HTTP | Type | Size | Visible | Component | Why it works |
|--------------|-------------|------|------|------|---------|-----------|--------------|
| `/_next/image?url=%2Fassets%2Foptimized%2Fmenu%2Fimport%2Fdeserty%2Fdeserty-krasnyi-barhat-a1ca297a9e-400w.webp&w=256&q=75` | `/assets/optimized/.../deserty-krasnyi-barhat-...-400w.webp` | **200** | `image/jpeg`* | ~21 KB | Yes | `ProductCardGrid` | File committed in `public/` **and** on R2; Next/Image reads local static file |
| `/_next/image?url=%2Fassets%2Foptimized%2F.../deserty-medovik-...-400w.webp&w=256&q=75` | same pattern | **200** | `image/jpeg`* | ~20 KB | Yes | `ProductCardGrid` | Same — Phase 1 public commit |
| `/_next/image?url=%2Fassets%2Foptimized%2F.../deserty-muravei-nik-...-400w.webp&w=256&q=75` | same pattern | **200** | `image/jpeg`* | ~19 KB | Yes | `ProductCardGrid` | Same — Phase 1 public commit |
| `/assets/optimized/assets/hero/union-decorative-900w.webp` | direct (plain `<img>`) | **200** | `image/webp` | 178,974 B | Yes | `products/page.tsx` decorative layers | Committed to `public/`; bypasses Next/Image |
| `/_next/image?url=%2Fassets%2Fmobile-home%2Flogo-kp2.png&w=256&q=75` | `/assets/mobile-home/logo-kp2.png` | **200** | image | varies | Yes | Header chrome | Unrelated local asset in `public/` |
| `/_next/image?url=https%3A%2F%2Fpub-...r2.dev%2Fassets%2Foptimized%2F...krasnyi-barhat...&w=256&q=75` | full R2 optimized URL (hypothetical test) | **200** | `image/jpeg`* | ~21 KB | N/A (not in prod HTML) | — | Proves Next/Image **can** proxy R2 when URL is full HTTPS |

\*Next/Image re-encodes WebP sources to JPEG/AVIF for the `w=` variant — response `Content-Type` is not source MIME.

**Note:** If env were set, krasnyi/medovik/muraveinik would also work via R2 URL (verified with manual curl). They work today only because Phase 1 accidentally duplicated those 3 files into git `public/`.

---

## Rendered HTML/RSC URL Counts

Fetched `GET https://kovkasyanplennica.vercel.app/products` (329 KB HTML, 2026-07-03).

| Pattern | Count |
|---------|-------|
| Local `/assets/optimized/` (any width) | **56** |
| Full R2 `pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev/assets/optimized/` | **0** |
| Any `pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev` | **8** (placeholders e.g. `box-icon.svg`, not product photos) |
| `-400w.webp` mentions (incl. encoded `_next/image` URLs) | **625** |
| `union-decorative.png` | **0** |
| `union-decorative-900w.webp` | **6** (local path) |
| Raw `.jpg` in HTML | **0** |
| Raw `.png` in HTML (non-encoded) | **13** (UI chrome) |
| `_next/image?url=%2Fassets%2Foptimized` | **575** |

**Unique `-400w.webp` storage keys referenced:** **30**  
→ **3** exist on Vercel `public/` (**200**)  
→ **27** missing (**404**)

Transform wiring (confirmed in code, not modified):

- `products-find-transform.service.ts` / `products-find-listing-transform.service.ts` → `toOptimizedProductCardUrl(firstImage)`
- `products-nav-preview.service.ts` → `toOptimizedProductCardUrl(raw)`
- `products/page.tsx` → `toOptimizedDecorativeUrl('/assets/hero/union-decorative.png')`
- `CategoryIcon.tsx` / `ProductCardGrid.tsx` consume pre-transformed URLs via `next/image`

---

## Helper Behavior

Source: `apps/web/lib/r2-assets.ts`, `apps/web/lib/image-optimization.ts`  
Tested with `npx tsx` (2026-07-03).

### `toR2Url()` / `staticAssetHref()`

| Input | With `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` | Without env |
|-------|--------------------------------------|-------------|
| `/assets/hero/union-decorative.png` | `https://pub-…r2.dev/assets/hero/union-decorative.png` | `/assets/hero/union-decorative.png` (unchanged) |
| `https://pub-…r2.dev/menu/.../deserty-brauni....jpg` | unchanged full URL | unchanged full URL |
| `menu/import/deserty/deserty-brauni....jpg` (no scheme) | `https://pub-…r2.dev/menu/import/...jpg` | `menu/import/...jpg` (unchanged — **not** a valid absolute URL) |
| `/assets/optimized/.../deserty-brauni-400w.webp` | `https://pub-…r2.dev/assets/optimized/...400w.webp` | `/assets/optimized/...400w.webp` (local) |

### Optimized URL helpers

| Helper | Input | With env | Without env |
|--------|-------|----------|-------------|
| `toOptimizedProductCardUrl` | R2 `.jpg` URL | `https://pub-…r2.dev/assets/optimized/menu/import/deserty/deserty-brauni-…-400w.webp` | **`/assets/optimized/menu/import/deserty/deserty-brauni-…-400w.webp`** ← matches prod |
| `toOptimizedProductCardUrl` | bare `menu/import/...jpg` | **`null`** (`processImageUrl` rejects non-absolute) | **`null`** |
| `toOptimizedProductCardUrl` | already `/assets/optimized/...400w.webp` | passthrough local path | passthrough local path |
| `toOptimizedDecorativeUrl` | `/assets/hero/union-decorative.png` | `https://pub-…r2.dev/assets/optimized/assets/hero/union-decorative-900w.webp` | `/assets/optimized/assets/hero/union-decorative-900w.webp` |
| `toOptimizedHeroUrl` | `/assets/hero/union-decorative.png` | `https://pub-…r2.dev/assets/hero/optimized/union-decorative-1600w.webp` | `/assets/hero/optimized/union-decorative-1600w.webp` |
| `toOptimizedCarouselUrl` | any | **throws** (`dir is not defined` — pre-existing bug, unused on `/products`) | same |

**Critical behavior gap:** When env is missing, helpers **always** return local `/assets/optimized/...` for R2-sourced product images. There is **no fallback** to the original R2 URL when the optimized object is absent locally.

**Expected vs actual:**

| Scenario | Expected | Actual |
|----------|----------|--------|
| Env set | Full R2 HTTPS optimized URLs | Correct in local test |
| Env missing | Fallback to **original** image URL | Returns local `/assets/optimized/...` → 404 for 90% of catalog |

---

## R2 Existence Check

Base: `https://pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev`

| Optimized key | Local (Vercel) | R2 optimized | Original on R2 | Exists in R2 (optimized) |
|---------------|----------------|--------------|------------------|--------------------------|
| `assets/optimized/menu/import/deserty/deserty-krasnyi-barhat-a1ca297a9e-400w.webp` | **200** (63 KB webp) | **200** | `.jpg` **200** | **Yes** |
| `assets/optimized/menu/import/deserty/deserty-medovik-s-sole-noi-karamelyu-dffbb5d49b-400w.webp` | **200** (57 KB) | **200** | `.jpg` **200** | **Yes** |
| `assets/optimized/menu/import/deserty/deserty-muravei-nik-a8a1189c69-400w.webp` | **200** (47 KB) | **200** | `.jpg` **200** | **Yes** |
| `assets/optimized/assets/hero/union-decorative-900w.webp` | **200** (179 KB) | **200** | `.png` (source) | **Yes** |
| `assets/optimized/menu/import/deserty/deserty-brauni-fd568152a9-400w.webp` | **404** | **404** | `.webp` **200** (214 KB) | **No** |
| `assets/optimized/menu/import/holodnye-zakuski/holodnye-zakuski-syrnaya-tarelka-evropei-cef199bd60-400w.webp` | **404** | **404** | `.jpg` **200** (13.5 MB) | **No** |
| `assets/optimized/menu/import/pitstsa/pitstsa-pitstsa-s-ohotnichimi-kolbaskami-164ddb000d-400w.webp` | **404** | **404** | (not checked) | **No** |
| `assets/optimized/menu/import/sousy/sousy-sousy-3721c9b870-400w.webp` | **404** | **404** | `.webp` **200** (242 KB) | **No** |

**Interpretation:**

- **R2 optimized 200 + local 404** → URL resolution / env issue (fix env + redeploy).
- **Both 404 but original R2 200** → optimized asset never generated/uploaded (**D**); env alone insufficient until batch optimize + upload.
- **Both 404 including original** → upstream data/path issue (not observed for samples above).

Phase 1 manifest (`apps/web/lib/image-optimization-manifest.json`) lists optimized outputs for: hero, gallery folder, union-decorative, and **exactly 3** dessert SKUs — consistent with R2 table.

Committed local WebPs (`apps/web/public/assets/optimized/`): **19 files** — same 3 desserts + union + gallery; **no** catalog-wide coverage.

---

## Next Image Config

File: `apps/web/next.config.js`

| Setting | Value | Impact |
|---------|-------|--------|
| `images.unoptimized` | **removed** (Phase 1) | Next/Image optimizer active |
| `remotePatterns` | `*.r2.dev` → `/**` | Allows any R2 public bucket host |
| `remotePatterns` | `pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev` → `/assets/**` | Allows explicit bucket (menu paths use `/menu/…` — covered by wildcard) |
| Custom loader | **none** | Default Next/Image loader |
| `formats` | `avif`, `webp` | Output re-encoding |

**Can Next/Image proxy `https://pub-…r2.dev/assets/optimized/...`?** **Yes** — verified:

```
GET /_next/image?url=https%3A%2F%2Fpub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev%2Fassets%2Foptimized%2Fmenu%2Fimport%2Fdeserty%2Fdeserty-krasnyi-barhat-a1ca297a9e-400w.webp&w=256&q=75
→ HTTP 200, ~21 KB
```

**Can Next/Image serve local `/assets/optimized/...`?** Only if the file exists under `public/` on the deployment. Missing files → **404** (79 B error body).

**Root cause is not remotePatterns (E).**

---

## Env Findings

| Check | Result |
|-------|--------|
| `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` in repo `.env` | **Not present** (no `R2` keys at all in `.env`) |
| `.env.example` | **No** `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` documented |
| Production HTML contains R2 optimized URLs | **No** (0 matches) — env empty at SSR |
| `next.config.js` env bootstrap | Loads `../../.env`, `../../env/.env`, `../../env/.env.local` at build — **only helps local/CI builds**, not Vercel unless same files exist there |
| Vercel Production env (dashboard) | **Not verified** — `gh` CLI unavailable; HTML evidence strongly indicates **missing or empty** on Production |
| Preview vs Production split | Unknown — production behavior matches “env absent” |
| Redeploy after env | N/A until env is set |
| Documented in Phase 2A report | Marked “required” but not enforced in Vercel |

**Safe public value (no secret):**

```
NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev
```

Must **not** include trailing `/assets` — helpers append path segments via `new URL(trimmedPath, base + '/')`.

`NEXT_PUBLIC_*` must be set in **Vercel Production** (and Preview if used) **before build**; changing env requires **redeploy**.

---

## Root Cause

Ranked by evidence strength:

| Rank | Classification | Evidence |
|------|----------------|----------|
| **1** | **A — Missing Vercel Production env** | 0 R2 optimized URLs in 329 KB SSR HTML; helper without env reproduces exact local paths seen in production |
| **2** | **C — Helper fallback incorrectly returns local optimized path** | `resolvePublicUrl()` → `toR2Url('/assets/optimized/...')` → local path when env empty; no fallback to original R2 URL |
| **3** | **D — Optimized assets missing from R2** | 27/30 catalog `-400w` keys 404 on R2; manifest only 3 desserts; originals exist for brauni/sousy/holodnye |
| **4** | **G — Partial git commit masks severity** | 3 dessert WebPs + union in `public/` make ~10% of cards look fine without env — easy to misread as “some optimization works” |
| — | **B — Env exists but no redeploy** | Unlikely primary cause given zero R2 URLs in HTML; would still apply after env is first added |
| — | **E — remotePatterns reject R2** | Ruled out — curl test 200 for R2 `_next/image` URL |
| — | **F — Component uses local URL directly** | Ruled out — components use helpers/services; no hardcoded `/assets/optimized/` in UI components |

---

## Recommended Fix

**Do not implement in this audit.** Proposed plan:

### 1. Vercel env (immediate)

- Add to **Production** (and Preview):
  ```
  NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev
  ```
- **Redeploy** Production after save.

**Expected after step 1 alone:** 3 dessert cards + decorative union switch to R2 URLs and keep working; **~90% of cards still broken** until step 2/3.

### 2. Helper fallback (code — Phase 2A follow-up)

In `toOptimizedProductCardUrl` / decorative helpers:

- If `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` is set → return full R2 optimized HTTPS URL (current behavior).
- If env missing **or** optimized key not known to exist → return **original** processed image URL (`processImageUrl` input), **never** bare local `/assets/optimized/...` unless file is guaranteed in `public/`.
- Optional: runtime HEAD is too heavy; prefer manifest lookup or “env required in prod” guard with build-time warning.

### 3. Generate + upload full catalog optimized WebPs (R2-only)

- Extend `optimize-homepage-images.ts` (or new script) to batch all `menu/import/**` product images at 400w (and 600/800 if needed).
- Upload to R2 under `assets/optimized/menu/import/...`.
- **Do not** commit WebP binaries to `apps/web/public/assets/**/optimized/`.
- Remove accidental Phase 1 public dessert WebPs from git once R2 + env are stable (shrinks deploy bundle).

### 4. Fix `toOptimizedCarouselUrl` bug

- `dir is not defined` — fix before using on carousel (not blocking `/products` today).

### 5. Documentation + CI guard

- Add `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` to `.env.example` with comment.
- Optional: production build check that fails if env unset when `VERCEL_ENV=production`.

### 6. Validation checklist (post-fix)

- [ ] Production HTML: **0** local `/assets/optimized/menu/` refs; **>0** `pub-…r2.dev/assets/optimized/` refs
- [ ] Network tab: product `_next/image` decoded URLs are `https://pub-…r2.dev/...`
- [ ] HEAD all `-400w.webp` keys for visible catalog → **200**
- [ ] Missing optimized keys fall back to original R2 URL (no gray placeholders)
- [ ] `union-decorative` loads from R2, not Vercel `/assets/optimized/...`

---

## Appendix: Network request classification (production)

| Class | Description | Observed on `/products` |
|-------|-------------|-------------------------|
| **A** | Working full R2 **original** | **Not used** in SSR (0 raw `.jpg` in HTML) |
| **B** | Working full R2 **optimized** | **0** in HTML (would work if env set) |
| **C** | Broken **local** optimized via `_next/image` | **575** refs; **27/30** unique keys → 404 |
| **D** | Other working local | Header logo, SVGs, union `<img>`, 3 dessert Next/Image |
| **E** | Other broken | None observed beyond class C |

---

## Files reviewed (read-only)

- `apps/web/lib/r2-assets.ts`
- `apps/web/lib/image-optimization.ts`
- `apps/web/lib/services/products-find-transform.service.ts`
- `apps/web/lib/services/products-find-listing-transform.service.ts`
- `apps/web/lib/services/products-nav-preview.service.ts`
- `apps/web/components/CategoryNavigation/CategoryIcon.tsx`
- `apps/web/components/CategoryNavigation/ProductsCategorySidebar.tsx`
- `apps/web/app/(main)/products/page.tsx`
- `apps/web/next.config.js`
- `apps/web/lib/image-optimization-manifest.json`
- `apps/web/public/assets/optimized/**` (inventory)
