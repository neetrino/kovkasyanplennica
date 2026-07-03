/**
 * Phase 5D test data cleanup — removes only PHASE5D_TEST_* records.
 *
 * Usage:
 *   node scripts/phase5d-cleanup-color-size-test-data.cjs --dry-run
 *   node scripts/phase5d-cleanup-color-size-test-data.cjs --apply
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { PrismaClient } = require("@prisma/client");

const TEST_SKU_PREFIX = "PHASE5D_TEST_";
const TEST_SLUG_PREFIX = "phase-5d-test-product-";
const SCRIPT_COLOR_VALUES = ["red", "blue", "green"];
const SCRIPT_SIZE_VALUES = ["M", "L", "S"];

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

  console.log("[phase5d-cleanup] DB safety OK");
  console.log("[phase5d-cleanup] NODE_ENV:", nodeEnv || "(unset)");
  console.log("[phase5d-cleanup] DATABASE_URL:", maskDatabaseUrl(databaseUrl));
}

async function findTestProducts(prisma) {
  return prisma.product.findMany({
    where: {
      deletedAt: null,
      OR: [
        { skuPrefix: { startsWith: TEST_SKU_PREFIX } },
        {
          translations: {
            some: { slug: { startsWith: TEST_SLUG_PREFIX } },
          },
        },
        {
          variants: {
            some: { sku: { startsWith: TEST_SKU_PREFIX } },
          },
        },
      ],
    },
    include: {
      translations: true,
      variants: { include: { options: true } },
    },
  });
}

async function deleteOrphanScriptAttributeValues(prisma, dryRun, log) {
  const colorAttribute = await prisma.attribute.findUnique({
    where: { key: "color" },
  });
  const sizeAttribute = await prisma.attribute.findUnique({
    where: { key: "size" },
  });

  const candidateValues = [];

  if (colorAttribute) {
    const rows = await prisma.attributeValue.findMany({
      where: {
        attributeId: colorAttribute.id,
        value: { in: SCRIPT_COLOR_VALUES },
      },
    });
    candidateValues.push(...rows);
  }

  if (sizeAttribute) {
    const rows = await prisma.attributeValue.findMany({
      where: {
        attributeId: sizeAttribute.id,
        value: { in: SCRIPT_SIZE_VALUES },
      },
    });
    candidateValues.push(...rows);
  }

  for (const valueRow of candidateValues) {
    const usageCount = await prisma.productVariantOption.count({
      where: { valueId: valueRow.id },
    });

    if (usageCount === 0) {
      log(
        `attributeValue:${valueRow.value}`,
        dryRun ? "would-delete" : "delete",
        valueRow.id
      );
      if (!dryRun) {
        await prisma.attributeValue.delete({ where: { id: valueRow.id } });
      }
    } else {
      log(
        `attributeValue:${valueRow.value}`,
        "keep",
        `still referenced by ${usageCount} option(s)`
      );
    }
  }
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  const dryRun = mode !== "apply";

  console.log("=== Phase 5D color/size test data cleanup ===");
  console.log("Mode:", mode);

  assertSafeDatabase(mode);

  const prisma = new PrismaClient({ log: ["error", "warn"] });
  const log = (entity, action, detail) => {
    console.log(`[phase5d-cleanup] ${action.toUpperCase()} ${entity} -> ${detail}`);
  };

  try {
    const products = await findTestProducts(prisma);

    if (products.length === 0) {
      console.log("[phase5d-cleanup] No Phase 5D test products found.");
    }

    for (const product of products) {
      const slug =
        product.translations.find((t) => t.locale === "en")?.slug ||
        product.translations[0]?.slug ||
        product.id;

      log(`product:${slug}`, dryRun ? "would-delete" : "delete", product.id);

      if (!dryRun) {
        await prisma.product.delete({ where: { id: product.id } });
      }
    }

    await deleteOrphanScriptAttributeValues(prisma, dryRun, log);

    console.log("\n=== Summary ===");
    console.log("Mode:", mode);
    console.log("Test products matched:", products.length);
    console.log(
      dryRun
        ? "No writes performed (dry-run)."
        : "Cleanup apply completed successfully."
    );
  } catch (error) {
    console.error("[phase5d-cleanup] ERROR:", error.message || error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
