/**
 * Replaces menu box-icon placeholder URLs with local /Group.png on products and variants.
 * Handles http/https, query strings, path-only, and comma-separated imageUrl lists.
 * Usage: npx tsx scripts/replace-menu-placeholder-product-urls.ts
 */

import "dotenv/config";
import type { Prisma } from "@prisma/client";
import { db } from "../packages/db";

const NEW_PLACEHOLDER_PATH = "/Group.png";

/** Full absolute URLs to the legacy placeholder (optional query string). */
const FULL_PLACEHOLDER_URL_REGEX =
  /https?:\/\/[^\s,]+?\/menu\/placeholders\/box-icon\.svg(?:\?[^\s,]*)?/gi;

/** Same path on any host (relative or after domain). */
const PATH_PLACEHOLDER_REGEX = /menu\/placeholders\/box-icon\.svg(?:\?[^\s,]*)?/gi;

function replaceUrlInString(value: string): string {
  let out = value.replace(FULL_PLACEHOLDER_URL_REGEX, NEW_PLACEHOLDER_PATH);
  out = out.replace(PATH_PLACEHOLDER_REGEX, NEW_PLACEHOLDER_PATH);
  out = out.replace(/,\s*,/g, ",").replace(/^[\s,]+|[\s,]+$/g, "");
  return out;
}

function replaceInMediaItem(item: Prisma.JsonValue): Prisma.JsonValue {
  if (typeof item === "string") {
    return replaceUrlInString(item);
  }
  if (item !== null && typeof item === "object" && !Array.isArray(item)) {
    const o = item as Record<string, Prisma.JsonValue>;
    const out: Record<string, Prisma.JsonValue> = { ...o };
    for (const k of ["url", "src", "value"] as const) {
      const v = o[k];
      if (typeof v === "string") {
        out[k] = replaceUrlInString(v);
      }
    }
    return out;
  }
  return item;
}

/** Deep string replace for variant.attributes (nested image URLs). */
function deepReplaceStringsInJson(value: Prisma.JsonValue): Prisma.JsonValue {
  if (typeof value === "string") {
    return replaceUrlInString(value);
  }
  if (Array.isArray(value)) {
    return value.map((x) => deepReplaceStringsInJson(x));
  }
  if (value !== null && typeof value === "object") {
    const o = value as Record<string, Prisma.JsonValue>;
    const out: Record<string, Prisma.JsonValue> = {};
    for (const [k, v] of Object.entries(o)) {
      out[k] = deepReplaceStringsInJson(v);
    }
    return out;
  }
  return value;
}

async function main(): Promise<void> {
  const variantRows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM product_variants
    WHERE (
      ("imageUrl" IS NOT NULL AND "imageUrl" LIKE ${"%box-icon%"})
      OR (attributes::text LIKE ${"%box-icon%"})
    )
  `;

  let variantsUpdated = 0;
  for (const row of variantRows) {
    const v = await db.productVariant.findUnique({
      where: { id: row.id },
      select: { id: true, imageUrl: true, attributes: true },
    });
    if (!v) continue;

    const nextImageUrl = v.imageUrl ? replaceUrlInString(v.imageUrl) : v.imageUrl;
    const nextAttributes =
      v.attributes === null || v.attributes === undefined
        ? v.attributes
        : deepReplaceStringsInJson(v.attributes as Prisma.JsonValue);

    const imageChanged = nextImageUrl !== v.imageUrl;
    const attrsChanged =
      JSON.stringify(nextAttributes) !== JSON.stringify(v.attributes);

    if (imageChanged || attrsChanged) {
      await db.productVariant.update({
        where: { id: v.id },
        data: {
          ...(imageChanged ? { imageUrl: nextImageUrl } : {}),
          ...(attrsChanged ? { attributes: nextAttributes as Prisma.JsonValue } : {}),
        },
      });
      variantsUpdated += 1;
    }
  }

  const productRows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM products
    WHERE "deletedAt" IS NULL
    AND media::text LIKE ${"%box-icon%"}
  `;

  let productsUpdated = 0;
  for (const row of productRows) {
    const p = await db.product.findUnique({
      where: { id: row.id },
      select: { id: true, media: true },
    });
    if (!p || !Array.isArray(p.media)) continue;

    const media = p.media;
    const newMedia = media.map((item) => replaceInMediaItem(item));
    const changed = newMedia.some((item, i) => JSON.stringify(item) !== JSON.stringify(media[i]));
    if (changed) {
      await db.product.update({
        where: { id: p.id },
        data: { media: newMedia },
      });
      productsUpdated += 1;
    }
  }

  console.log(
    `replace-menu-placeholder-product-urls: variants=${variantsUpdated}, products=${productsUpdated}`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
