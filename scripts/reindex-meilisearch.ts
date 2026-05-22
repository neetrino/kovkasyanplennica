/**
 * Reindex all published products into Meilisearch.
 * Run: npx tsx scripts/reindex-meilisearch.ts
 */
import "dotenv/config";
import { db } from "@white-shop/db";
import { indexProducts } from "../apps/web/lib/services/search.service";
import { isMeilisearchConfigured } from "../apps/web/lib/services/search-index.service";

async function main(): Promise<void> {
  if (!isMeilisearchConfigured()) {
    console.error("❌ Set MEILI_HOST (and MEILI_MASTER_KEY) in .env");
    process.exit(1);
  }

  const products = await db.product.findMany({
    where: { published: true, deletedAt: null },
    include: {
      translations: true,
      variants: { where: { published: true } },
      brand: { include: { translations: true } },
    },
  });

  console.log(`📦 Indexing ${products.length} products...`);
  const ok = await indexProducts(
    products.map((p) => ({
      ...p,
      categoryIds: p.categoryIds ?? [],
    }))
  );

  if (!ok) {
    console.error("❌ Meilisearch indexing failed");
    process.exit(1);
  }

  console.log("✅ Meilisearch reindex complete");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
