/**
 * Maps `/assets/...` and root static paths to Cloudflare R2 when configured.
 * Logo and favicon always stay on the local Next.js public folder.
 */

/** Paths that must never be served from R2 (logo + favicon). */
const LOCAL_ASSET_PATHS = new Set([
  '/hero-logo.png',
  '/assets/hero/logo-kp.png',
  '/assets/mobile-home/logo-kp2.png',
  '/assets/New folder/favicon.png',
]);

function normalizePublicPath(publicPath: string): string {
  return publicPath.startsWith('/') ? publicPath : `/${publicPath}`;
}

function readR2PublicBase(): string {
  return (
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim() ??
    process.env.R2_PUBLIC_URL?.trim() ??
    ''
  ).replace(/\/+$/, '');
}

export function toR2Url(publicPath: string): string {
  const normalized = normalizePublicPath(publicPath);
  if (LOCAL_ASSET_PATHS.has(normalized)) {
    return normalized;
  }

  const base = readR2PublicBase();
  if (!base) {
    return normalized;
  }

  const trimmedPath = normalized.startsWith('/') ? normalized.slice(1) : normalized;
  return new URL(trimmedPath, `${base}/`).href;
}

/** For `src` / href: full R2 URLs are left as-is; local paths get `encodeURI` for Cyrillic/spaces. */
export function staticAssetHref(path: string): string {
  const resolved = toR2Url(path);
  if (resolved.startsWith('https://') || resolved.startsWith('http://')) {
    return resolved;
  }
  return encodeURI(resolved);
}
