import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { PrismaClient } from "@prisma/client";

type MenuRow = {
  category: string;
  title: string;
  price: string;
  description?: string;
  image_path?: string;
  image_paths_all?: string;
  image_urls?: string[];
};

type CategoryCache = Record<string, string>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

dotenv.config({ path: path.resolve(rootDir, ".env") });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

const MENU_JSON_PATH = path.resolve(rootDir, "json", "menu_for_review_columns_r2.json");
const PLACEHOLDER_KEY = "menu/placeholders/box-icon.svg";

function slugify(input: string): string {
  const cyrillicMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const lower = input.toLowerCase();
  const transliterated = Array.from(lower)
    .map((char) => cyrillicMap[char] ?? char)
    .join("");

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80) || "item";
}

function parsePrice(raw: string): number {
  const normalized = (raw || "").replace(",", ".").trim();
  const price = Number.parseFloat(normalized);
  return Number.isFinite(price) ? price : 0;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildImageUrls(row: MenuRow, fallbackUrl: string): string[] {
  if (Array.isArray(row.image_urls) && row.image_urls.length > 0) {
    const clean = row.image_urls.map((x) => x.trim()).filter(Boolean);
    return clean.length > 0 ? clean : [fallbackUrl];
  }

  if (row.image_paths_all) {
    const fromAll = row.image_paths_all
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean);
    if (fromAll.length > 0) {
      return fromAll;
    }
  }

  if (row.image_path && row.image_path.trim()) {
    return [row.image_path.trim()];
  }

  return [fallbackUrl];
}

function buildSku(categorySlug: string, productSlug: string, index: number): string {
  const source = `${categorySlug}-${productSlug}-${index}`;
  const hash = createHash("sha1").update(source).digest("hex").slice(0, 8).toUpperCase();
  return `MENU-${hash}`;
}

function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

async function ensurePlaceholderInR2(): Promise<string> {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    throw new Error("R2 env vars are missing");
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" fill="none"><rect width="800" height="800" rx="48" fill="#F6F7FB"/><rect x="160" y="230" width="480" height="340" rx="24" fill="#E9ECF5"/><path d="M400 148 620 260 400 372 180 260 400 148Z" fill="#C8D0E3"/><path d="M620 260v210c0 22-12 43-32 53l-160 81V372l192-112Z" fill="#AEBAD4"/><path d="M180 260v210c0 22 12 43 32 53l160 81V372L180 260Z" fill="#BEC8DD"/><path d="M348 448h104c14 0 24 11 24 24v76H324v-76c0-13 10-24 24-24Z" fill="#8EA0C4"/><circle cx="400" cy="320" r="30" fill="#8EA0C4"/></svg>`;
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: PLACEHOLDER_KEY,
      Body: Buffer.from(svg, "utf8"),
      ContentType: "image/svg+xml",
    })
  );
  return `${R2_PUBLIC_URL}/${PLACEHOLDER_KEY}`;
}

async function getOrCreateCategoryId(
  dbClient: PrismaClient,
  categoryTitle: string,
  cache: CategoryCache
): Promise<string> {
  const key = categoryTitle.trim().toLowerCase();
  const fromCache = cache[key];
  if (fromCache) {
    return fromCache;
  }

  const existingTranslation = await dbClient.categoryTranslation.findFirst({
    where: {
      locale: "ru",
      title: categoryTitle.trim(),
    },
    select: {
      categoryId: true,
    },
  });

  if (existingTranslation?.categoryId) {
    cache[key] = existingTranslation.categoryId;
    return existingTranslation.categoryId;
  }

  const slug = slugify(categoryTitle);
  const created = await dbClient.category.create({
    data: {
      published: true,
      translations: {
        create: {
          locale: "ru",
          title: categoryTitle.trim(),
          slug,
          fullPath: slug,
          description: null,
          seoTitle: null,
          seoDescription: null,
        },
      },
    },
    select: { id: true },
  });

  cache[key] = created.id;
  return created.id;
}

async function main(): Promise<void> {
  const dbModule = await import("../packages/db");
  const dbClient = dbModule.db as PrismaClient;
  const raw = await readFile(MENU_JSON_PATH, "utf8");
  const rows = JSON.parse(raw) as MenuRow[];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`No rows found in ${MENU_JSON_PATH}`);
  }

  const placeholderUrl = await ensurePlaceholderInR2();
  console.log(`placeholder ready: ${placeholderUrl}`);

  const categoryCache: CategoryCache = {};
  let createdProducts = 0;
  let skippedProducts = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const categoryTitle = row.category?.trim() || "";
    const title = row.title?.trim() || "";

    if (!categoryTitle || !title) {
      skippedProducts += 1;
      continue;
    }

    const categoryId = await getOrCreateCategoryId(dbClient, categoryTitle, categoryCache);
    const categorySlug = slugify(categoryTitle);
    const productSlug = slugify(`${title}-${categoryTitle}`);

    const existingProduct = await dbClient.product.findFirst({
      where: {
        deletedAt: null,
        primaryCategoryId: categoryId,
        translations: {
          some: {
            locale: "ru",
            title,
          },
        },
      },
      select: { id: true },
    });

    if (existingProduct) {
      skippedProducts += 1;
      continue;
    }

    const imageUrls = buildImageUrls(row, placeholderUrl);
    const mainImage = imageUrls[0] || placeholderUrl;
    const price = parsePrice(row.price);
    const descriptionText = (row.description || "").trim();
    const descriptionHtml = descriptionText ? `<p>${escapeHtml(descriptionText)}</p>` : undefined;

    const sku = buildSku(categorySlug, productSlug, index + 1);

    await dbClient.product.create({
      data: {
        published: true,
        featured: false,
        publishedAt: new Date(),
        primaryCategoryId: categoryId,
        categoryIds: [categoryId],
        attributeIds: [],
        categories: {
          connect: [{ id: categoryId }],
        },
        media: imageUrls,
        translations: {
          create: {
            locale: "ru",
            title,
            slug: productSlug,
            subtitle: null,
            descriptionHtml,
            seoTitle: null,
            seoDescription: null,
          },
        },
        variants: {
          create: [
            {
              sku,
              price,
              stock: 100,
              published: true,
              imageUrl: mainImage,
            },
          ],
        },
      },
    });

    createdProducts += 1;
    if ((index + 1) % 25 === 0) {
      console.log(`processed ${index + 1}/${rows.length}`);
    }
  }

  console.log(`done. created=${createdProducts}, skipped=${skippedProducts}, total=${rows.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const dbModule = await import("../packages/db");
    await dbModule.db.$disconnect();
  });
