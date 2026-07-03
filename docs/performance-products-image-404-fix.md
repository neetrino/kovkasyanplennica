# /products Image 404 Fix

**Date:** 2026-07-03  
**Production URL:** https://kovkasyanplennica.vercel.app/products  
**Commit message:** `fix(products): prevent optimized image 404s`

---

## Root Cause

Dual failure from [performance-products-image-404-audit.md](./performance-products-image-404-audit.md):

1. **`NEXT_PUBLIC_R2_PUBLIC_BASE_URL` missing on Vercel Production** — helpers emitted local `/assets/optimized/...` paths that do not exist on the deployment.
2. **Catalog optimized WebPs not on R2** — Phase 1 only generated 3 dessert thumbnails + hero/gallery assets; ~90% of `/products` card keys 404’d on both Vercel and R2.
3. **Unsafe helper fallback** — when env was absent, helpers returned local optimized paths instead of original R2 URLs.
4. **Accidental git commit** of 23 optimized WebP files under `public/` masked the issue for 3 desserts.

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/lib/image-optimization-manifest.ts` | **New** — manifest lookup (`isOptimizedKeyAvailable`, `getSourceForOptimizedKey`) |
| `apps/web/lib/image-optimization.ts` | Safe fallback: manifest + env → R2 optimized URL; else original URL; fixed `toOptimizedCarouselUrl` (`dir` bug) |
| `apps/web/lib/image-optimization-manifest.json` | **Updated** — 88 entries, 96 optimized keys (73 new catalog 400w WebPs) |
| `apps/web/scripts/optimize-catalog-images.ts` | **New** — paginated API scan, 400w WebP @ quality 90, R2 upload, manifest merge |
| `apps/web/package.json` | `optimize:catalog-images` script |
| `.env.example` | Clarified `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` + Vercel redeploy note |
| `.gitignore` | Ignore `apps/web/public/assets/**/optimized/` and `.cache/image-optimize/` |
| `apps/web/public/assets/**/optimized/**` | **Removed from git** (23 WebP binaries untracked, remain R2-only) |

**Not changed:** Prisma queries, listing/preview query logic, ISR/cache, UI components (helpers only).

---

## Env Requirement

```bash
NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev
```

- No trailing slash, no `/assets` suffix.
- Set on **Vercel Production and Preview**.
- **Redeploy required** after adding/changing ( `NEXT_PUBLIC_*` is inlined at build time).
- Documented in `.env.example`.

R2 upload script additionally requires `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` (server-side only, not committed).

---

## Helper Fallback Behavior

| Condition | `toOptimizedProductCardUrl` | `toOptimizedDecorativeUrl` |
|-----------|------------------------------|----------------------------|
| Empty input | `null` | N/A |
| SVG | unchanged | unchanged |
| Env **+** manifest has optimized key | Full R2 `…/assets/optimized/…-{width}w.webp` | Full R2 optimized decorative URL |
| Env missing | **Original** URL (full R2 HTTPS or local `/assets/…` source) | **Original** `/assets/hero/union-decorative.png` |
| Env set, key **not** in manifest | **Original** URL | **Original** decorative path |
| Already `-400w.webp` URL | Resolve via manifest → R2 if env; else source original | same pattern |

No runtime HEAD requests. Availability is determined solely by `image-optimization-manifest.json`.

Verified with isolated helper test (env unset):

- brauni card → `https://pub-…r2.dev/menu/import/deserty/deserty-brauni-fd568152a9.webp` (original)
- fake SKU → original URL (no broken local path)
- decorative → `/assets/hero/union-decorative.png`

With env set:

- brauni card → `https://pub-…r2.dev/assets/optimized/menu/import/deserty/deserty-brauni-…-400w.webp`
- decorative → R2 `union-decorative-900w.webp`

---

## Catalog Optimization / R2 Upload

```bash
npm run optimize:catalog-images --workspace=@shop/web
```

- Scans production `/api/v1/products` (paginated, 76 unique sources).
- Fetches originals from R2 (`.webp`, `.jpg`, `.jpeg`, `.png`).
- Generates **400w WebP**, quality **90**.
- Uploads to `assets/optimized/menu/import/…/*-400w.webp`.
- Caches locally under `apps/web/.cache/image-optimize/` (gitignored).
- Merges manifest; skips existing keys.

**Run result (2026-07-03):**

- **73** new catalog images uploaded to R2
- **3** skipped (Phase 1 desserts already in manifest)
- **R2 verify:** 73 ok, **0** missing

---

## R2 Existence Check

Previously broken keys (audit samples) after upload:

| Optimized key | R2 status |
|---------------|-----------|
| `…/deserty-brauni-fd568152a9-400w.webp` | **200** |
| `…/holodnye-zakuski-syrnaya-tarelka-evropei-cef199bd60-400w.webp` | **200** |
| `…/pitstsa-pitstsa-s-ohotnichimi-kolbaskami-164ddb000d-400w.webp` | **200** |
| `…/sousy-sousy-3721c9b870-400w.webp` | **200** |

Manifest total optimized output keys: **96**.

---

## Validation Without Env

| Check | Result |
|-------|--------|
| Helper unit test (explicit `delete process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL`) | **Pass** — originals returned, no `/assets/optimized/menu/import/` |
| `npm run build` (shell env unset; local `.env` may still load via `next.config.js`) | **Pass** — compile successful |
| Local `next start` + `/products` HTML | Decorative + cards use **full R2 optimized URLs** when local `.env` has `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` (expected local dev setup) |

**Production simulation:** On Vercel without env, SSR + client helpers now fall back to **original R2 URLs** — no 404 local optimized paths.

---

## Validation With Env

| Check | Result |
|-------|--------|
| `npm run build` with `NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://pub-…r2.dev` | **Pass** |
| Helper test with env | Optimized R2 URLs for manifest entries |
| Local `/products` HTML (env present) | Full R2 optimized URLs in `<img>` / `_next/image` payloads |
| `_next/image?url=%2Fassets%2Foptimized…` | **0** in primary image src paths (with env + new code) |

---

## Production Deployment Checklist

- [ ] Add `NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev` to **Vercel Production**
- [ ] Add same to **Vercel Preview** (if used)
- [ ] **Redeploy** production after env change
- [ ] Confirm production HTML contains `pub-…r2.dev/assets/optimized/menu/import/` URLs
- [ ] Confirm **0** `/_next/image?url=%2Fassets%2Foptimized…` **404** responses in Network tab
- [ ] Confirm no gray product image placeholders on `/products`
- [ ] Confirm **no** optimized WebP binaries under `apps/web/public/assets/**/optimized/` in git
- [ ] Re-run `npm run optimize:catalog-images` when new menu products are added

---

## Remaining Risks

| Risk | Mitigation |
|------|------------|
| New product images added without running catalog script | Re-run `optimize:catalog-images`; helpers fall back to originals until manifest updated |
| Vercel env set only on Preview, not Production | Follow deployment checklist |
| Homepage 600w/800w variants not regenerated for new catalog items | Cards use 400w only on `/products`; homepage still uses Phase 1 widths for 3 desserts |
| `npm run lint` repo-wide reports 1 pre-existing error + warnings | Changed files lint clean; build passes |
| Local `.env` has R2 secrets — never commit | `.env` gitignored; only `.env.example` updated |

---

## Commands Run

```bash
npm run optimize:catalog-images --workspace=@shop/web   # 73 uploads, R2 verify 73/73
npm run build --workspace=@shop/web                     # without + with NEXT_PUBLIC_R2_PUBLIC_BASE_URL
npx eslint lib/image-optimization.ts lib/image-optimization-manifest.ts  # pass
```

**Not pushed** per task instructions.
