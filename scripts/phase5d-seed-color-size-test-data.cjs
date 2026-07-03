/**
 * Phase 5D test data seed — color/size filter validation only.
 *
 * Usage:
 *   node scripts/phase5d-seed-color-size-test-data.cjs --dry-run
 *   node scripts/phase5d-seed-color-size-test-data.cjs --apply
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { PrismaClient } = require("@prisma/client");

const TEST_SKU_PREFIX = "PHASE5D_TEST_";
const LOCALES = ["en", "ru", "hy"];
const COLOR_VALUES = ["red", "blue", "green"];
const SIZE_VALUES = ["M", "L", "S"];

const TEST_PRODUCTS = [
  {
    slug: "phase-5d-test-product-a",
    skuPrefix: "PHASE5D_TEST_A",
    title: "Phase 5D Test Product A",
    variants: [
      {
        sku: "PHASE5D_TEST_A-RED-M",
        color: "red",
        size: "M",
        price: 1000,
        stock: 10,
      },
      {
        sku: "PHASE5D_TEST_A-BLUE-L",
        color: "blue",
        size: "L",
        price: 2000,
        stock: 10,
      },
    ],
  },
  {
    slug: "phase-5d-test-product-b",
    skuPrefix: "PHASE5D_TEST_B",
    title: "Phase 5D Test Product B",
    variants: [
      {
        sku: "PHASE5D_TEST_B-RED-L",
        color: "red",
        size: "L",
        price: 3000,
        stock: 10,
      },
    ],
  },
  {
    slug: "phase-5d-test-product-c",
    skuPrefix: "PHASE5D_TEST_C",
    title: "Phase 5D Test Product C",
    variants: [
      {
        sku: "PHASE5D_TEST_C-GREEN-S",
        color: "green",
        size: "S",
        price: 4000,
        stock: 10,
      },
    ],
  },
];

function parseMode(argv) {
  if (argv.includes("--apply")) return "apply";
  if (argv.includes("--dry-run")) return "dry-run";
  return "dry-run";
}

function maskDatabaseUrl(rawUrl) {
  if (!rawUrl) return "(missing)";
  return rawUrl.replace(/(postgresql:\/\/[^:]+:)[^@]+(@.+)/, "$1****$2");
}

function assertSafeDatabase(mode) {
  const nodeEnv = (process.env.NODE_ENV || "").trim().toLowerCase();
  const databaseUrl = process.env.DATABASE_URL || "";

  if (!databaseUrl.trim()) {
    throw new Error("Refusing to run: DATABASE_URL is missing.");
  }

  if (nodeEnv === "production") {
    throw new Error("Refusing to run: NODE_ENV=production.");
  }

  const blockedHostPatterns = [
    /prod/i,
    /production/i,
    /\.live\b/i,
    /primary\.prod/i,
  ];

  for (const pattern of blockedHostPatterns) {
    if (pattern.test(databaseUrl)) {
      throw new Error(
        `Refusing to run: DATABASE_URL looks like production (${pattern}).`
      );
    }
  }

  if (mode === "apply" && process.env.PHASE5D_ALLOW_DB_WRITE !== "1") {
    throw new Error(
      "Refusing --apply: set PHASE5D_ALLOW_DB_WRITE=1 to confirm non-production writes."
    );
  }

  console.log("[phase5d-seed] DB safety OK");
  console.log("[phase5d-seed] NODE_ENV:", nodeEnv || "(unset)");
  console.log("[phase5d-seed] DATABASE_URL:", maskDatabaseUrl(databaseUrl));
}

function buildTranslationRows(title, slug) {
  return LOCALES.map((locale) => ({
    locale,
    title,
    slug,
    descriptionHtml: `<p>${title} — Phase 5D color/size filter test product.</p>`,
  }));
}

async function ensureAttribute(prisma, key, names, dryRun, log) {
  const existing = await prisma.attribute.findUnique({ where: { key } });
  if (existing) {
    log(`attribute:${key}`, "reuse", existing.id);
    return existing;
  }

  if (dryRun) {
    log(`attribute:${key}`, "create", "(dry-run)");
    return { id: `dry-${key}`, key };
  }

  const created = await prisma.attribute.create({
    data: {
      key,
      type: "select",
      filterable: true,
      position: key === "color" ? 0 : 1,
      translations: {
        create: names,
      },
    },
  });
  log(`attribute:${key}`, "create", created.id);
  return created;
}

async function ensureAttributeValue(
  prisma,
  attributeId,
  canonicalValue,
  dryRun,
  log
) {
  const existing = await prisma.attributeValue.findFirst({
    where: { attributeId, value: canonicalValue },
  });

  if (existing) {
    log(`attributeValue:${canonicalValue}`, "reuse", existing.id);
    return existing;
  }

  if (dryRun) {
    log(`attributeValue:${canonicalValue}`, "create", "(dry-run)");
    return { id: `dry-${canonicalValue}`, value: canonicalValue };
  }

  const created = await prisma.attributeValue.create({
    data: {
      attributeId,
      value: canonicalValue,
      position: 0,
      translations: {
        create: LOCALES.map((locale) => ({
          locale,
          label: canonicalValue,
        })),
      },
    },
  });
  log(`attributeValue:${canonicalValue}`, "create", created.id);
  return created;
}

async function ensureProductAttribute(prisma, productId, attributeId, dryRun, log) {
  const existing = await prisma.productAttribute.findUnique({
    where: {
      productId_attributeId: { productId, attributeId },
    },
  });

  if (existing) {
    log(`productAttribute:${productId}:${attributeId}`, "reuse", existing.id);
    return existing;
  }

  if (dryRun) {
    log(`productAttribute:${productId}:${attributeId}`, "create", "(dry-run)");
    return null;
  }

  const created = await prisma.productAttribute.create({
    data: { productId, attributeId },
  });
  log(`productAttribute:${productId}:${attributeId}`, "create", created.id);
  return created;
}

async function syncVariantOptions(
  prisma,
  variantId,
  colorValue,
  sizeValue,
  colorAttribute,
  sizeAttribute,
  colorValueRow,
  sizeValueRow,
  dryRun,
  log
) {
  const desired = [
    {
      attributeId: colorAttribute.id,
      attributeKey: "color",
      value: colorValue,
      valueId: colorValueRow.id,
    },
    {
      attributeId: sizeAttribute.id,
      attributeKey: "size",
      value: sizeValue,
      valueId: sizeValueRow.id,
    },
  ];

  const existingOptions = await prisma.productVariantOption.findMany({
    where: { variantId },
  });

  if (dryRun) {
    log(`variantOptions:${variantId}`, "sync", `${colorValue}/${sizeValue}`);
    return;
  }

  for (const option of existingOptions) {
    await prisma.productVariantOption.delete({ where: { id: option.id } });
  }

  for (const option of desired) {
    await prisma.productVariantOption.create({
      data: { variantId, ...option },
    });
  }

  log(`variantOptions:${variantId}`, "sync", `${colorValue}/${sizeValue}`);
}

async function upsertTestProduct(
  prisma,
  productSpec,
  colorAttribute,
  sizeAttribute,
  colorValueMap,
  sizeValueMap,
  dryRun,
  log
) {
  const existing = await prisma.product.findFirst({
    where: {
      deletedAt: null,
      translations: { some: { slug: productSpec.slug, locale: "en" } },
    },
    include: {
      translations: true,
      variants: { include: { options: true } },
    },
  });

  let productId = existing?.id;

  if (existing) {
    log(`product:${productSpec.slug}`, "reuse", existing.id);
    if (!dryRun) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          skuPrefix: productSpec.skuPrefix,
          published: true,
          publishedAt: existing.publishedAt || new Date(),
        },
      });
    }
  } else if (dryRun) {
    log(`product:${productSpec.slug}`, "create", "(dry-run)");
    productId = `dry-${productSpec.slug}`;
  } else {
    const created = await prisma.product.create({
      data: {
        skuPrefix: productSpec.skuPrefix,
        published: true,
        publishedAt: new Date(),
        media: [],
        translations: {
          create: buildTranslationRows(productSpec.title, productSpec.slug),
        },
      },
    });
    productId = created.id;
    log(`product:${productSpec.slug}`, "create", created.id);
  }

  if (!dryRun && productId && !productId.startsWith("dry-")) {
    for (const row of buildTranslationRows(productSpec.title, productSpec.slug)) {
      await prisma.productTranslation.upsert({
        where: {
          productId_locale: { productId, locale: row.locale },
        },
        update: { title: row.title, slug: row.slug, descriptionHtml: row.descriptionHtml },
        create: { productId, ...row },
      });
    }
  }

  if (productId && !productId.startsWith("dry-")) {
    await ensureProductAttribute(
      prisma,
      productId,
      colorAttribute.id,
      dryRun,
      log
    );
    await ensureProductAttribute(
      prisma,
      productId,
      sizeAttribute.id,
      dryRun,
      log
    );
  }

  for (const variantSpec of productSpec.variants) {
    let variant = existing?.variants.find((v) => v.sku === variantSpec.sku);

    if (variant) {
      log(`variant:${variantSpec.sku}`, "reuse", variant.id);
      if (!dryRun) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            price: variantSpec.price,
            stock: variantSpec.stock,
            published: true,
          },
        });
      }
    } else if (dryRun) {
      log(`variant:${variantSpec.sku}`, "create", "(dry-run)");
      variant = { id: `dry-${variantSpec.sku}` };
    } else {
      const createdVariant = await prisma.productVariant.create({
        data: {
          productId,
          sku: variantSpec.sku,
          price: variantSpec.price,
          stock: variantSpec.stock,
          published: true,
        },
      });
      variant = createdVariant;
      log(`variant:${variantSpec.sku}`, "create", createdVariant.id);
    }

    await syncVariantOptions(
      prisma,
      variant.id,
      variantSpec.color,
      variantSpec.size,
      colorAttribute,
      sizeAttribute,
      colorValueMap.get(variantSpec.color),
      sizeValueMap.get(variantSpec.size),
      dryRun,
      log
    );
  }

  if (!dryRun && existing) {
    const allowedSkus = new Set(productSpec.variants.map((v) => v.sku));
    for (const variant of existing.variants) {
      if (!allowedSkus.has(variant.sku)) {
        await prisma.productVariant.delete({ where: { id: variant.id } });
        log(`variant:${variant.sku}`, "delete", variant.id);
      }
    }
  }
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  const dryRun = mode !== "apply";

  console.log("=== Phase 5D color/size test data seed ===");
  console.log("Mode:", mode);

  assertSafeDatabase(mode);

  const prisma = new PrismaClient({ log: ["error", "warn"] });
  const actions = [];

  const log = (entity, action, detail) => {
    const line = `${action.toUpperCase()} ${entity} -> ${detail}`;
    actions.push(line);
    console.log(`[phase5d-seed] ${line}`);
  };

  try {
    const colorAttribute = await ensureAttribute(
      prisma,
      "color",
      [
        { locale: "en", name: "Color" },
        { locale: "ru", name: "Цвет" },
        { locale: "hy", name: "Գույն" },
      ],
      dryRun,
      log
    );

    const sizeAttribute = await ensureAttribute(
      prisma,
      "size",
      [
        { locale: "en", name: "Size" },
        { locale: "ru", name: "Размер" },
        { locale: "hy", name: "Չափ" },
      ],
      dryRun,
      log
    );

    const colorValueMap = new Map();
    for (const value of COLOR_VALUES) {
      const row = await ensureAttributeValue(
        prisma,
        colorAttribute.id,
        value,
        dryRun,
        log
      );
      colorValueMap.set(value, row);
    }

    const sizeValueMap = new Map();
    for (const value of SIZE_VALUES) {
      const row = await ensureAttributeValue(
        prisma,
        sizeAttribute.id,
        value,
        dryRun,
        log
      );
      sizeValueMap.set(value, row);
    }

    for (const productSpec of TEST_PRODUCTS) {
      await upsertTestProduct(
        prisma,
        productSpec,
        colorAttribute,
        sizeAttribute,
        colorValueMap,
        sizeValueMap,
        dryRun,
        log
      );
    }

    console.log("\n=== Summary ===");
    console.log("Mode:", mode);
    console.log("Actions logged:", actions.length);
    console.log(
      dryRun
        ? "No writes performed (dry-run)."
        : "Apply completed successfully."
    );
  } catch (error) {
    console.error("[phase5d-seed] ERROR:", error.message || error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
