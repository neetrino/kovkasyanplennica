/**
 * ReDoS-safe slug from title: no polynomial regex on user input.
 * Use for categories, brands, and any user-provided name → URL slug.
 */
export function toSlug(title: string): string {
  const withHyphens = title
    .toLowerCase()
    .split("")
    .map((c) => (/[a-z0-9]/.test(c) ? c : "-"))
    .join("");
  const collapsed = withHyphens
    .split("-")
    .filter((s) => s.length > 0)
    .join("-");
  return collapsed;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizeProductSlug(rawSlug: string): string {
  return safeDecode(rawSlug)
    .trim()
    .toLowerCase()
    .replace(/[\s/\\_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildProductSlugCandidates(rawSlug: string): string[] {
  const decoded = safeDecode(rawSlug).trim();
  const normalized = normalizeProductSlug(rawSlug);
  const candidates = new Set<string>();

  if (decoded) {
    candidates.add(decoded);
  }
  if (normalized) {
    candidates.add(normalized);
  }
  if (decoded.toLowerCase()) {
    candidates.add(decoded.toLowerCase());
  }

  return Array.from(candidates);
}
