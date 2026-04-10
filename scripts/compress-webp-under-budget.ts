/**
 * Compresses WebP images in a folder to stay under a byte budget (default 200 KiB).
 * Run from repo root: npx tsx scripts/compress-webp-under-budget.ts
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const MAX_BYTES = 200 * 1024;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const FOLDER = path.join(REPO_ROOT, "apps/web/public/assets/New folder");

async function compressFile(filePath: string): Promise<void> {
  const input = await fs.readFile(filePath);

  const encode = async (maxSide: number, quality: number): Promise<Buffer> => {
    return sharp(input)
      .resize(maxSide, maxSide, { fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();
  };

  let maxSide = 2200;

  while (maxSide >= 480) {
    let lo = 20;
    let hi = 90;
    let best: Buffer | null = null;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const buf = await encode(maxSide, mid);
      if (buf.length <= MAX_BYTES) {
        best = buf;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    if (best) {
      await fs.writeFile(filePath, best);
      console.log(
        `${path.basename(filePath)}: ${(best.length / 1024).toFixed(1)} KB`,
      );
      return;
    }

    maxSide = Math.floor(maxSide * 0.86);
  }

  throw new Error(`Could not fit ${filePath} under ${MAX_BYTES} bytes`);
}

async function main(): Promise<void> {
  const entries = await fs.readdir(FOLDER, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".webp"))
    .map((e) => path.join(FOLDER, e.name));

  for (const filePath of files) {
    await compressFile(filePath);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
