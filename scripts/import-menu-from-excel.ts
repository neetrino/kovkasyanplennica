import * as dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMenuBackup } from "./menu-import/backup";
import { assertCatalogEmpty, getCatalogCounts, logCounts, type CatalogCounts } from "./menu-import/counts";
import { cleanupMenuCatalog } from "./menu-import/cleanup";
import { createImportDb } from "./menu-import/db-client";
import { defaultExcelPath, readMenuExcel } from "./menu-import/excel";
import { matchImagesToProducts, scanCategoryImages } from "./menu-import/images";
import { normalizeKey, slugify } from "./menu-import/normalize";
import { buildSku, ensurePlaceholderUrl, readR2Config, uploadMenuImages } from "./menu-import/r2";
import { createDbRef, resetRetryCount, totalRetryCount, withDbRetry, type DbRef } from "./menu-import/retry";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const EXISTING_BACKUP = path.join(rootDir, "backups", "menu-import", "2026-06-30T13-49", "menu-catalog-backup.json");

dotenv.config({ path: path.resolve(rootDir, ".env") });
dotenv.config({ path: path.resolve(rootDir, "env", ".env") });

type CliOptions = {
  force: boolean;
  skipCleanup: boolean;
  backup: boolean;
  excelPath: string;
  categoryDir: string;
};

type ImportStats = {
  categoriesCreated: number;
  productsCreated: number;
  productsSkipped: number;
  productsWithR2Images: number;
  productsWithPlaceholder: number;
  failedImageMatches: number;
};

function parseArgs(argv: string[]): CliOptions {
  const force = argv.includes("--force");
  return {
    force,
    skipCleanup: argv.includes("--skip-cleanup"),
    backup: !argv.includes("--no-backup"),
    excelPath: defaultExcelPath(rootDir),
    categoryDir: path.join(rootDir, "Category"),
  };
}

function assertDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is missing. Create .env in project root before import.");
  }
}

async function confirmExistingBackup(): Promise<void> {
  try {
    await fs.access(EXISTING_BACKUP);
    console.log(`Existing safety backup: ${EXISTING_BACKUP}`);
  } catch {
    console.warn("Previous safety backup not found at expected path (import will create a new one on --force).");
  }
}

async function createCategoriesUpfront(
  dbRef: DbRef,
  categoryTitles: string[]
): Promise<Map<string, string>> {
  const categoryIds = new Map<string, string>();

  for (let position = 0; position < categoryTitles.length; position += 1) {
    const title = categoryTitles[position];
    const slug = slugify(title);

    const categoryId = await withDbRetry(
      `category:create:${slug}`,
      dbRef,
      async (db) => {
        const existing = await db.categoryTranslation.findFirst({
          where: { locale: "ru", title },
          select: { categoryId: true },
        });
        if (existing?.categoryId) return existing.categoryId;

        const created = await db.category.create({
          data: {
            published: true,
            position,
            translations: {
              create: {
                locale: "ru",
                title,
                slug,
                fullPath: slug,
              },
            },
          },
          select: { id: true },
        });
        return created.id;
      }
    );

    categoryIds.set(title, categoryId);
  }

  return categoryIds;
}

async function importCatalog(
  dbRef: DbRef,
  options: CliOptions,
  dryRun: boolean,
  categoryIds: Map<string, string>
): Promise<ImportStats> {
  const rows = readMenuExcel(options.excelPath);
  const images = scanCategoryImages(options.categoryDir);
  const imageMatches = matchImagesToProducts(rows, images);
  const r2Config = readR2Config();
  const placeholderUrl = dryRun
    ? `${r2Config.publicUrl}/menu/placeholders/box-icon.svg`
    : await ensurePlaceholderUrl(r2Config);

  const categorySlugByTitle = new Map<string, string>();
  for (const title of categoryIds.keys()) {
    categorySlugByTitle.set(title, slugify(title));
  }

  const categorySlugByFolder = new Map<string, string>();
  for (const image of images) {
    categorySlugByFolder.set(image.categoryFolder, slugify(image.categoryFolder));
  }

  const uniqueImages = [
    ...new Map([...imageMatches.values()].map((image) => [image.relativePath, image])).values(),
  ];

  const uploadedUrls = await uploadMenuImages(
    uniqueImages,
    categorySlugByFolder,
    r2Config,
    dryRun
  );

  const usedSlugs = new Set<string>();
  const stats: ImportStats = {
    categoriesCreated: categoryIds.size,
    productsCreated: 0,
    productsSkipped: 0,
    productsWithR2Images: 0,
    productsWithPlaceholder: 0,
    failedImageMatches: 0,
  };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const categorySlug = categorySlugByTitle.get(row.category) ?? slugify(row.category);
    let productSlug = slugify(`${row.title}-${row.category}`);
    if (usedSlugs.has(productSlug)) {
      productSlug = `${productSlug}-${index + 1}`;
    }
    usedSlugs.add(productSlug);

    const matchKey = `${normalizeKey(row.category)}::${normalizeKey(row.title)}`;
    const matchedImage = imageMatches.get(matchKey);
    const imageUrl = matchedImage
      ? uploadedUrls.get(matchedImage.relativePath) ?? placeholderUrl
      : placeholderUrl;

    if (!matchedImage) stats.failedImageMatches += 1;
    if (imageUrl === placeholderUrl) stats.productsWithPlaceholder += 1;
    else stats.productsWithR2Images += 1;

    if (dryRun) continue;

    const categoryId = categoryIds.get(row.category);
    if (!categoryId) {
      throw new Error(`Category not found for row: ${row.category}`);
    }

    const existingSlug = await withDbRetry(
      `product:lookup:${productSlug}`,
      dbRef,
      (db) =>
        db.productTranslation.findFirst({
          where: { locale: "ru", slug: productSlug },
          select: { productId: true },
        })
    );

    if (existingSlug?.productId) {
      stats.productsSkipped += 1;
      console.log(`skipped duplicate slug: ${productSlug}`);
      continue;
    }

    const sku = buildSku(categorySlug, productSlug, index + 1);

    await withDbRetry(`product:create:${productSlug}`, dbRef, (db) =>
      db.product.create({
        data: {
          published: true,
          featured: false,
          publishedAt: new Date(),
          primaryCategoryId: categoryId,
          categoryIds: [categoryId],
          attributeIds: [],
          categories: { connect: [{ id: categoryId }] },
          media: [imageUrl],
          translations: {
            create: {
              locale: "ru",
              title: row.title,
              slug: productSlug,
              subtitle: row.weight || null,
              descriptionHtml: row.descriptionHtml,
            },
          },
          variants: {
            create: [
              {
                sku,
                price: row.price,
                stock: 100,
                published: true,
                imageUrl,
                position: 0,
              },
            ],
          },
        },
      })
    );

    stats.productsCreated += 1;
    if (stats.productsCreated % 25 === 0) {
      console.log(`import progress: ${stats.productsCreated}/${rows.length} products`);
    }
  }

  return stats;
}

function printImportSummary(
  dryRun: boolean,
  stats: ImportStats,
  excelRows: number,
  imagesScanned: number,
  placeholderUrl: string,
  backupPath: string | null,
  beforeCleanup: CatalogCounts | null,
  afterCleanup: CatalogCounts | null,
  afterImport: CatalogCounts | null
): void {
  console.log("\n=== Final import summary ===");
  console.log({
    mode: dryRun ? "dry-run" : "force",
    backupPath,
    beforeCleanup,
    afterCleanup,
    afterImport,
    excelRows,
    imagesScanned,
    categoriesImported: stats.categoriesCreated,
    productsImported: dryRun ? excelRows : stats.productsCreated,
    productsSkipped: stats.productsSkipped,
    variantsImported: dryRun ? excelRows : stats.productsCreated,
    productsWithR2Images: stats.productsWithR2Images,
    productsWithPlaceholder: stats.productsWithPlaceholder,
    failedImageMatches: stats.failedImageMatches,
    placeholderUrl,
    totalRetries: totalRetryCount,
  });
}

async function main(): Promise<void> {
  resetRetryCount();
  const options = parseArgs(process.argv.slice(2));
  const dryRun = !options.force;

  console.log("Menu import from Excel");
  console.log({
    dryRun,
    skipCleanup: options.skipCleanup,
    backup: options.backup,
    excelPath: options.excelPath,
    categoryDir: options.categoryDir,
  });

  assertDatabaseUrl();
  readR2Config();
  await confirmExistingBackup();

  const db = createImportDb();
  const dbRef = createDbRef(db);

  try {
    const beforeCounts = await withDbRetry("counts:before", dbRef, getCatalogCounts);
    logCounts("Before cleanup", beforeCounts);

    let backupPath: string | null = null;
    let afterCleanupCounts: CatalogCounts | null = null;

    if (dryRun) {
      const rows = readMenuExcel(options.excelPath);
      const categoryTitles = [...new Set(rows.map((row) => row.category))];
      const stats = await importCatalog(
        dbRef,
        options,
        true,
        new Map(categoryTitles.map((t) => [t, "dry-run"]))
      );
      printImportSummary(
        true,
        stats,
        rows.length,
        scanCategoryImages(options.categoryDir).length,
        "",
        null,
        beforeCounts,
        null,
        beforeCounts
      );
      console.log("\nDry run complete. Re-run with --force to write to DB and upload images.");
      return;
    }

    if (options.backup) {
      backupPath = await withDbRetry("backup:create", dbRef, (client) => createMenuBackup(client, rootDir));
      console.log(`Backup saved to ${backupPath}`);
    }

    if (!options.skipCleanup) {
      console.log("Cleaning existing menu catalog (including partial import)...");
      await withDbRetry("cleanup:catalog", dbRef, cleanupMenuCatalog);
      afterCleanupCounts = await withDbRetry("counts:after-cleanup", dbRef, getCatalogCounts);
      logCounts("After cleanup", afterCleanupCounts);
      assertCatalogEmpty(afterCleanupCounts);
    }

    const rows = readMenuExcel(options.excelPath);
    const categoryTitles = [...new Set(rows.map((row) => row.category))];
    console.log(`Creating ${categoryTitles.length} categories upfront...`);
    const categoryIds = await createCategoriesUpfront(dbRef, categoryTitles);
    console.log(`Categories ready: ${categoryIds.size}`);

    const stats = await importCatalog(dbRef, options, false, categoryIds);

    const afterImportCounts = await withDbRetry("counts:after-import", dbRef, getCatalogCounts);
    logCounts("After import", afterImportCounts);

    const r2Config = readR2Config();
    printImportSummary(
      false,
      stats,
      rows.length,
      scanCategoryImages(options.categoryDir).length,
      `${r2Config.publicUrl}/menu/placeholders/box-icon.svg`,
      backupPath,
      beforeCounts,
      afterCleanupCounts,
      afterImportCounts
    );

    console.log("\nDone. Run: npm run search:reindex");
  } finally {
    await dbRef.getDb().$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
