import "dotenv/config";
import { db } from "../packages/db";

type ProductTranslationRow = {
  id: string;
  productId: string;
  locale: string;
  slug: string;
  title: string;
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function sanitizeSlug(value: string): string {
  return safeDecode(value)
    .trim()
    .toLowerCase()
    .replace(/[\s/\\_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildFallbackSlug(title: string, productId: string): string {
  const fromTitle = sanitizeSlug(title);
  if (fromTitle) {
    return fromTitle;
  }
  return `product-${productId.slice(0, 8).toLowerCase()}`;
}

function ensureUniqueSlug(
  locale: string,
  baseSlug: string,
  currentRowId: string,
  usedByLocale: Map<string, Map<string, string>>
): string {
  const localeMap = usedByLocale.get(locale) ?? new Map<string, string>();
  if (!usedByLocale.has(locale)) {
    usedByLocale.set(locale, localeMap);
  }

  if (!localeMap.has(baseSlug) || localeMap.get(baseSlug) === currentRowId) {
    localeMap.set(baseSlug, currentRowId);
    return baseSlug;
  }

  let index = 2;
  let candidate = `${baseSlug}-${index}`;
  while (localeMap.has(candidate) && localeMap.get(candidate) !== currentRowId) {
    index += 1;
    candidate = `${baseSlug}-${index}`;
  }

  localeMap.set(candidate, currentRowId);
  return candidate;
}

async function fixProductSlugs(): Promise<void> {
  const rows = await db.productTranslation.findMany({
    select: {
      id: true,
      productId: true,
      locale: true,
      slug: true,
      title: true,
    },
  });

  const translations = rows as ProductTranslationRow[];
  const usedByLocale = new Map<string, Map<string, string>>();
  const updates: Array<{ id: string; oldSlug: string; newSlug: string; locale: string }> = [];

  for (const row of translations) {
    const sanitized = sanitizeSlug(row.slug);
    const baseSlug = sanitized || buildFallbackSlug(row.title, row.productId);
    const finalSlug = ensureUniqueSlug(row.locale, baseSlug, row.id, usedByLocale);

    if (finalSlug !== row.slug) {
      updates.push({
        id: row.id,
        oldSlug: row.slug,
        newSlug: finalSlug,
        locale: row.locale,
      });
    }
  }

  if (updates.length === 0) {
    console.log("No product slugs needed fixes.");
    return;
  }

  console.log(`Updating ${updates.length} product translation slug(s)...`);

  for (const update of updates) {
    await db.productTranslation.update({
      where: { id: update.id },
      data: { slug: update.newSlug },
    });
    console.log(`[${update.locale}] ${update.oldSlug} -> ${update.newSlug}`);
  }

  console.log(`Done. Updated ${updates.length} slug(s).`);
}

fixProductSlugs()
  .catch((error: unknown) => {
    console.error("Failed to fix product slugs:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
