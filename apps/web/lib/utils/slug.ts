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
