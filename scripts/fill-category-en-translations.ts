import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

dotenv.config({ path: path.resolve(rootDir, ".env") });

function slugify(input: string): string {
  const cyrillicMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };

  const transliterated = input
    .toLowerCase()
    .split("")
    .map((char) => cyrillicMap[char] ?? char)
    .join("");

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80) || "category";
}

async function main(): Promise<void> {
  const { db } = await import("../packages/db");

  const categories = await db.category.findMany({
    where: { deletedAt: null },
    include: { translations: true },
  });

  let created = 0;
  let skipped = 0;

  for (const category of categories) {
    const ru = category.translations.find((t) => t.locale === "ru");
    const en = category.translations.find((t) => t.locale === "en");

    if (en || !ru) {
      skipped += 1;
      continue;
    }

    const baseSlug = slugify(ru.title);
    const slug = `${baseSlug}-en`;

    await db.categoryTranslation.create({
      data: {
        categoryId: category.id,
        locale: "en",
        title: ru.title,
        slug,
        fullPath: slug,
        description: ru.description ?? null,
        seoTitle: ru.seoTitle ?? null,
        seoDescription: ru.seoDescription ?? null,
      },
    });

    created += 1;
  }

  console.log(`done. created=${created}, skipped=${skipped}, total=${categories.length}`);
  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
