import fs from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";

const BACKUP_TABLES = [
  "categories",
  "category_translations",
  "products",
  "product_translations",
  "product_variants",
  "product_labels",
  "product_attributes",
] as const;

export async function createMenuBackup(
  db: PrismaClient,
  rootDir: string
): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const backupDir = path.join(rootDir, "backups", "menu-import", stamp);
  await fs.mkdir(backupDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    counts: {} as Record<string, number>,
    data: {} as Record<string, unknown>,
  };

  payload.data.categories = await db.category.findMany({ include: { translations: true } });
  payload.data.category_translations = await db.categoryTranslation.findMany();
  payload.data.products = await db.product.findMany({
    include: {
      translations: true,
      variants: true,
      labels: true,
      productAttributes: true,
      categories: { select: { id: true } },
    },
  });
  payload.data.product_translations = await db.productTranslation.findMany();
  payload.data.product_variants = await db.productVariant.findMany();
  payload.data.product_labels = await db.productLabel.findMany();
  payload.data.product_attributes = await db.productAttribute.findMany();

  for (const table of BACKUP_TABLES) {
    payload.counts[table] = Array.isArray(payload.data[table]) ? payload.data[table].length : 0;
  }

  await fs.writeFile(
    path.join(backupDir, "menu-catalog-backup.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8"
  );

  return backupDir;
}
