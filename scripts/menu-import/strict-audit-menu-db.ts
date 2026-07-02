import * as dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import { createImportDb } from "./db-client";
import { defaultExcelPath, readMenuExcel, type MenuExcelRow } from "./excel";
import { normalizeKey, normalizeText, slugify } from "./normalize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(rootDir, "env", ".env") });

export type ExpectedMenu = {
  rows: MenuExcelRow[];
  expectedProductTitles: string[];
  expectedProductSlugs: string[];
  expectedCategories: string[];
  titleToSlug: Map<string, string>;
  slugSet: Set<string>;
  titleKeySet: Set<string>;
  categoryKeySet: Set<string>;
};

export function buildExpectedFromExcel(excelPath: string): ExpectedMenu {
  const rows = readMenuExcel(excelPath);
  const usedSlugs = new Set<string>();
  const titleToSlug = new Map<string, string>();
  const expectedProductSlugs: string[] = [];
  const expectedProductTitles: string[] = [];
  const categorySet = new Set<string>();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    expectedProductTitles.push(row.title);
    categorySet.add(row.category);

    let productSlug = slugify(`${row.title}-${row.category}`);
    if (usedSlugs.has(productSlug)) {
      productSlug = `${productSlug}-${index + 1}`;
    }
    usedSlugs.add(productSlug);
    expectedProductSlugs.push(productSlug);
    titleToSlug.set(normalizeKey(row.title), productSlug);
  }

  return {
    rows,
    expectedProductTitles,
    expectedProductSlugs,
    expectedCategories: [...categorySet],
    titleToSlug,
    slugSet: new Set(expectedProductSlugs),
    titleKeySet: new Set(expectedProductTitles.map((t) => normalizeKey(t))),
    categoryKeySet: new Set([...categorySet].map((c) => normalizeKey(c))),
  };
}

type DbProductRow = {
  id: string;
  title: string;
  slug: string;
  categoryIds: string[];
  variantCount: number;
};

type DbCategoryRow = {
  id: string;
  title: string;
  slug: string;
};

export type StrictAuditResult = {
  expected: ExpectedMenu;
  products: DbProductRow[];
  categories: DbCategoryRow[];
  extraProducts: DbProductRow[];
  missingProducts: string[];
  extraCategories: DbCategoryRow[];
  missingCategories: string[];
  duplicateSlugs: string[];
  duplicateTitles: string[];
  productsWithoutVariants: DbProductRow[];
  productsWithoutCategories: DbProductRow[];
  foundWdewdwed: DbProductRow[];
  foundBakaleya: DbCategoryRow[];
  counts: {
    products: number;
    productTranslations: number;
    variants: number;
    categories: number;
    categoryTranslations: number;
  };
};

function findDuplicates(values: string[]): string[] {
  const seen = new Map<string, number>();
  const dupes: string[] = [];
  for (const value of values) {
    const key = normalizeKey(value);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [key, count] of seen) {
    if (count > 1) dupes.push(`${key} (${count}x)`);
  }
  return dupes;
}

function isExpectedProduct(
  product: DbProductRow,
  expected: ExpectedMenu
): boolean {
  const titleKey = normalizeKey(product.title);
  const slugMatch = expected.slugSet.has(product.slug);
  const titleMatch = expected.titleKeySet.has(titleKey);
  return slugMatch || titleMatch;
}

function isExpectedCategory(category: DbCategoryRow, expected: ExpectedMenu): boolean {
  return expected.categoryKeySet.has(normalizeKey(category.title));
}

export async function loadDbCatalog(db: PrismaClient): Promise<{
  products: DbProductRow[];
  categories: DbCategoryRow[];
  counts: StrictAuditResult["counts"];
}> {
  const [productsRaw, categoriesRaw, counts] = await Promise.all([
    db.product.findMany({
      where: { deletedAt: null },
      include: {
        translations: { where: { locale: "ru" } },
        variants: { select: { id: true } },
        categories: { select: { id: true } },
      },
    }),
    db.category.findMany({
      where: { deletedAt: null },
      include: { translations: { where: { locale: "ru" } } },
    }),
    Promise.all([
      db.product.count({ where: { deletedAt: null } }),
      db.productTranslation.count(),
      db.productVariant.count(),
      db.category.count({ where: { deletedAt: null } }),
      db.categoryTranslation.count(),
    ]).then(([products, productTranslations, variants, categories, categoryTranslations]) => ({
      products,
      productTranslations,
      variants,
      categories,
      categoryTranslations,
    })),
  ]);

  const products: DbProductRow[] = productsRaw.map((p) => {
    const ru = p.translations[0];
    return {
      id: p.id,
      title: ru?.title ?? "",
      slug: ru?.slug ?? "",
      categoryIds: p.categories.map((c) => c.id),
      variantCount: p.variants.length,
    };
  });

  const categories: DbCategoryRow[] = categoriesRaw.map((c) => {
    const ru = c.translations[0];
    return {
      id: c.id,
      title: ru?.title ?? "",
      slug: ru?.slug ?? "",
    };
  });

  return { products, categories, counts };
}

export function compareExcelWithDb(
  expected: ExpectedMenu,
  products: DbProductRow[],
  categories: DbCategoryRow[],
  counts: StrictAuditResult["counts"]
): StrictAuditResult {
  const extraProducts = products.filter((p) => !isExpectedProduct(p, expected));
  const matchedTitleKeys = new Set(
    products
      .filter((p) => isExpectedProduct(p, expected))
      .map((p) => normalizeKey(p.title))
  );
  const missingProducts = expected.expectedProductTitles.filter(
    (title) => !matchedTitleKeys.has(normalizeKey(title))
  );

  const extraCategories = categories.filter((c) => !isExpectedCategory(c, expected));
  const matchedCategoryKeys = new Set(
    categories
      .filter((c) => isExpectedCategory(c, expected))
      .map((c) => normalizeKey(c.title))
  );
  const missingCategories = expected.expectedCategories.filter(
    (title) => !matchedCategoryKeys.has(normalizeKey(title))
  );

  return {
    expected,
    products,
    categories,
    extraProducts,
    missingProducts,
    extraCategories,
    missingCategories,
    duplicateSlugs: findDuplicates(products.map((p) => p.slug)),
    duplicateTitles: findDuplicates(products.map((p) => p.title)),
    productsWithoutVariants: products.filter((p) => p.variantCount === 0),
    productsWithoutCategories: products.filter((p) => p.categoryIds.length === 0),
    foundWdewdwed: products.filter((p) => normalizeKey(p.title).includes("wdewdwed") || p.slug.includes("wdewdwed")),
    foundBakaleya: categories.filter((c) => normalizeKey(c.title).includes("бакале")),
    counts,
  };
}

export function printStrictAuditReport(audit: StrictAuditResult): void {
  console.log("\n=== STRICT MENU DB AUDIT ===\n");
  console.log(`expected products: ${audit.expected.expectedProductTitles.length}`);
  console.log(`expected categories: ${audit.expected.expectedCategories.length}`);
  console.log(`actual products: ${audit.products.length}`);
  console.log(`actual categories: ${audit.categories.length}`);
  console.log("");
  console.log(`extra products (${audit.extraProducts.length}):`, audit.extraProducts.map((p) => `${p.title} [${p.slug}]`));
  console.log(`missing products (${audit.missingProducts.length}):`, audit.missingProducts);
  console.log(`extra categories (${audit.extraCategories.length}):`, audit.extraCategories.map((c) => c.title));
  console.log(`missing categories (${audit.missingCategories.length}):`, audit.missingCategories);
  console.log(`duplicate slugs:`, audit.duplicateSlugs);
  console.log(`duplicate titles:`, audit.duplicateTitles);
  console.log(`products without variants:`, audit.productsWithoutVariants.map((p) => p.title));
  console.log(`products without categories:`, audit.productsWithoutCategories.map((p) => p.title));
  console.log(`found wdewdwed:`, audit.foundWdewdwed.map((p) => p.title));
  console.log(`found Бакалея:`, audit.foundBakaleya.map((c) => c.title));
  console.log("\nDB counts:", audit.counts);
}

export async function backupCatalogForStrictCleanup(
  db: PrismaClient,
  root: string
): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const backupDir = path.join(root, "backups", "menu-strict-cleanup", stamp);
  await fs.mkdir(backupDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    categories: await db.category.findMany({ include: { translations: true } }),
    products: await db.product.findMany({
      include: { translations: true, variants: true, categories: true },
    }),
  };

  await fs.writeFile(
    path.join(backupDir, "menu-before-strict-cleanup.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8"
  );

  return backupDir;
}

export async function removeExtraCatalogItems(
  db: PrismaClient,
  extraProductIds: string[],
  extraCategoryIds: string[]
): Promise<{ deletedProducts: number; deletedCategories: number }> {
  if (extraProductIds.length === 0 && extraCategoryIds.length === 0) {
    return { deletedProducts: 0, deletedCategories: 0 };
  }

  const variants = extraProductIds.length
    ? await db.productVariant.findMany({
        where: { productId: { in: extraProductIds } },
        select: { id: true },
      })
    : [];
  const variantIds = variants.map((v) => v.id);

  if (variantIds.length > 0) {
    await db.orderItem.updateMany({
      where: { variantId: { in: variantIds } },
      data: { variantId: null },
    });
    await db.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
  }

  if (extraProductIds.length > 0) {
    await db.cartItem.deleteMany({ where: { productId: { in: extraProductIds } } });
    await db.productReview.deleteMany({ where: { productId: { in: extraProductIds } } });
    await db.product.deleteMany({ where: { id: { in: extraProductIds } } });
  }

  if (extraCategoryIds.length > 0) {
    await db.category.deleteMany({ where: { id: { in: extraCategoryIds } } });
  }

  return {
    deletedProducts: extraProductIds.length,
    deletedCategories: extraCategoryIds.length,
  };
}

async function checkApi(
  baseUrl: string,
  expected: ExpectedMenu
): Promise<{
  productsTotal: number;
  badProducts: string[];
  badCategories: string[];
  apiExtraProducts: string[];
}> {
  const badProducts: string[] = [];
  const badCategories: string[] = [];
  const apiExtraProducts: string[] = [];

  try {
    const productsRes = await fetch(`${baseUrl}/api/v1/products?limit=100&lang=ru`);
    const productsJson = (await productsRes.json()) as {
      data?: Array<{ title?: string; slug?: string }>;
      meta?: { total?: number };
    };
    const items = productsJson.data ?? [];
    for (const item of items) {
      const title = item.title ?? "";
      const slug = item.slug ?? "";
      if (normalizeKey(title).includes("wdewdwed") || slug.includes("wdewdwed")) {
        badProducts.push(`${title} [${slug}]`);
      }
      if (!expected.titleKeySet.has(normalizeKey(title)) && !expected.slugSet.has(slug)) {
        apiExtraProducts.push(`${title} [${slug}]`);
      }
    }

    const categoriesRes = await fetch(`${baseUrl}/api/v1/categories/tree?lang=ru`);
    const categoriesJson = (await categoriesRes.json()) as {
      data?: Array<{ title?: string; children?: Array<{ title?: string }> }>;
    };
    const walk = (nodes: Array<{ title?: string; children?: Array<{ title?: string }> }> | undefined): void => {
      for (const node of nodes ?? []) {
        const title = node.title ?? "";
        if (normalizeKey(title).includes("бакале")) badCategories.push(title);
        if (!expected.categoryKeySet.has(normalizeKey(title))) {
          badCategories.push(title);
        }
        walk(node.children as Array<{ title?: string; children?: Array<{ title?: string }> }> | undefined);
      }
    };
    walk(categoriesJson.data);

    return {
      productsTotal: productsJson.meta?.total ?? items.length,
      badProducts,
      badCategories: [...new Set(badCategories)],
      apiExtraProducts,
    };
  } catch (error) {
    console.warn("API check skipped:", error instanceof Error ? error.message : error);
    return { productsTotal: -1, badProducts: [], badCategories: [], apiExtraProducts: [] };
  }
}

async function main(): Promise<void> {
  const cleanupMode = process.argv.includes("--cleanup");
  const excelPath = defaultExcelPath(rootDir);
  const expected = buildExpectedFromExcel(excelPath);

  console.log("Strict menu DB audit");
  console.log({ excelPath, excelRows: expected.rows.length, mode: cleanupMode ? "cleanup" : "audit-only" });

  const db = createImportDb();
  try {
    const { products, categories, counts } = await loadDbCatalog(db);
    let audit = compareExcelWithDb(expected, products, categories, counts);
    printStrictAuditReport(audit);

    if (!cleanupMode) {
      const api = await checkApi(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", expected);
      console.log("\nAPI check:", api);
      return;
    }

    if (audit.extraProducts.length === 0 && audit.extraCategories.length === 0) {
      console.log("\nNo extra catalog items to remove.");
    } else {
      const backupPath = await backupCatalogForStrictCleanup(db, rootDir);
      console.log(`\nBackup saved: ${backupPath}`);

      const removed = await removeExtraCatalogItems(
        db,
        audit.extraProducts.map((p) => p.id),
        audit.extraCategories.map((c) => c.id)
      );
      console.log("Removed:", removed);

      const after = await loadDbCatalog(db);
      audit = compareExcelWithDb(expected, after.products, after.categories, after.counts);
      printStrictAuditReport(audit);
    }

    const api = await checkApi(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", expected);
    console.log("\nAPI check after cleanup:", api);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
