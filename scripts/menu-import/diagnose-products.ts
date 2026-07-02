import * as dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createImportDb } from "./db-client";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const TARGETS = [
  "Брокколи",
  "Рис басмати",
  "Рис басматти",
  "Картофельное пюре",
  "Пивные сеты",
];

function dbFingerprint(): { host: string; database: string } {
  const raw = process.env.DATABASE_URL ?? "";
  try {
    const u = new URL(raw);
    return { host: u.hostname, database: u.pathname.replace(/^\//, "") };
  } catch {
    return { host: "unparsable", database: "unknown" };
  }
}

async function main(): Promise<void> {
  console.log("DATABASE fingerprint:", dbFingerprint());
  const db = createImportDb();
  try {
    for (const title of TARGETS) {
      const rows = await db.productTranslation.findMany({
        where: { locale: "ru", title: { contains: title, mode: "insensitive" } },
        select: { productId: true, title: true, slug: true },
      });
      console.log(`\n"${title}": ${rows.length} match(es)`);
      for (const row of rows) console.log(" ", row);
    }

    const garniry = await db.categoryTranslation.findMany({
      where: { locale: "ru", title: { contains: "Гарнир", mode: "insensitive" } },
      select: { categoryId: true, title: true, slug: true },
    });
    console.log("\nCategories matching 'Гарнир':", garniry);

    for (const cat of garniry) {
      const products = await db.product.findMany({
        where: {
          deletedAt: null,
          categories: { some: { id: cat.categoryId } },
        },
        include: { translations: { where: { locale: "ru" } } },
      });
      console.log(`\nProducts in "${cat.title}":`);
      for (const p of products) {
        const ru = p.translations[0];
        console.log(" ", ru?.title, `[${ru?.slug}]`);
      }
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
