/**
 * Maps `/assets/...` paths to the Cloudflare R2 public URL when `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` is set.
 * Uses URL resolution so path segments (spaces, non-ASCII) are encoded correctly.
 */
export function toR2Url(publicPath: string): string {
  const raw = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim() ?? '';
  const base = raw.replace(/\/+$/, '');
  if (!base) {
    return publicPath;
  }
  const trimmedPath = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath;
  return new URL(trimmedPath, `${base}/`).href;
}

/** For `src` / href: full R2 URLs are left as-is; local `/assets/...` paths get `encodeURI` for Cyrillic/spaces. */
export function staticAssetHref(path: string): string {
  const resolved = toR2Url(path);
  if (resolved.startsWith('https://') || resolved.startsWith('http://')) {
    return resolved;
  }
  return encodeURI(resolved);
}
