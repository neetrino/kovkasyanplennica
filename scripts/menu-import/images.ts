import fs from "node:fs";
import path from "node:path";
import { normalizeKey, stripNamePrefixes } from "./normalize";

export type LocalMenuImage = {
  absolutePath: string;
  relativePath: string;
  categoryFolder: string;
  fileName: string;
  stem: string;
  ext: string;
};

const IMAGE_EXT = /\.(webp|jpe?g|png|gif)$/i;

function aliasStem(value: string): string {
  return normalizeKey(value)
    .replace(/номер/g, "n")
    .replace(/№/g, "n")
    .replace(/n(\d)/g, "n$1")
    .replace(/кесадиль/g, "кесодиль")
    .replace(/наггетс/g, "нагетс")
    .replace(/свинины говядина/g, "свинины+говядина")
    .replace(/\+/g, " ");
}

function tokens(value: string): string[] {
  return aliasStem(stripNamePrefixes(value)).split(" ").filter(Boolean);
}

function extractAssortiNumber(value: string): string | null {
  const match = value.match(/(?:№|номер|n)\s*(\d+)/i) ?? value.match(/(\d+)\s*$/);
  return match?.[1] ?? null;
}

function scoreMatch(productTitle: string, imageStem: string): number {
  const productKey = aliasStem(stripNamePrefixes(productTitle.split("(")[0]));
  const imageKey = aliasStem(stripNamePrefixes(imageStem));
  if (!productKey || !imageKey) return 0;
  if (productKey === imageKey) return 100;
  if (imageKey.includes(productKey) || productKey.includes(imageKey)) return 85;

  const productNumber = extractAssortiNumber(productTitle);
  const imageNumber = extractAssortiNumber(imageStem);
  if (
    productNumber &&
    imageNumber &&
    productNumber === imageNumber &&
    (productKey.includes("ассорт") || imageKey.includes("ассорт"))
  ) {
    return 90;
  }

  const productTokens = tokens(productTitle);
  const imageTokens = tokens(imageStem);
  const overlap = productTokens.filter((token) =>
    imageTokens.some((imageToken) => imageToken.includes(token) || token.includes(imageToken))
  ).length;
  const ratio = overlap / Math.max(productTokens.length, imageTokens.length, 1);
  return ratio >= 0.55 ? Math.round(ratio * 75) : 0;
}

export function scanCategoryImages(categoryDir: string): LocalMenuImage[] {
  const images: LocalMenuImage[] = [];

  function walk(currentDir: string): void {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!IMAGE_EXT.test(entry.name)) continue;
      images.push({
        absolutePath: fullPath,
        relativePath: path.relative(categoryDir, fullPath).replace(/\\/g, "/"),
        categoryFolder: path.basename(path.dirname(fullPath)),
        fileName: entry.name,
        stem: path.parse(entry.name).name,
        ext: path.extname(entry.name).toLowerCase(),
      });
    }
  }

  if (!fs.existsSync(categoryDir)) {
    throw new Error(`Category image folder not found: ${categoryDir}`);
  }

  walk(categoryDir);
  return images;
}

export function matchImagesToProducts(
  products: Array<{ category: string; title: string }>,
  images: LocalMenuImage[]
): Map<string, LocalMenuImage> {
  const byCategory = new Map<string, LocalMenuImage[]>();
  for (const image of images) {
    const key = normalizeKey(image.categoryFolder);
    const list = byCategory.get(key) ?? [];
    list.push(image);
    byCategory.set(key, list);
  }

  const used = new Set<string>();
  const matches = new Map<string, LocalMenuImage>();

  for (const product of products) {
    const productKey = `${normalizeKey(product.category)}::${normalizeKey(product.title)}`;
    const categoryImages = byCategory.get(normalizeKey(product.category)) ?? [];

    let best: LocalMenuImage | null = null;
    let bestScore = 0;
    for (const image of categoryImages) {
      if (used.has(image.relativePath)) continue;
      const score = scoreMatch(product.title, image.stem);
      if (score > bestScore) {
        bestScore = score;
        best = image;
      }
    }

    if (best && bestScore >= 55) {
      matches.set(productKey, best);
      used.add(best.relativePath);
      continue;
    }

    if (categoryImages.length === 1) {
      const shared = categoryImages[0];
      matches.set(productKey, shared);
    }
  }

  return matches;
}

export function contentTypeForExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}
