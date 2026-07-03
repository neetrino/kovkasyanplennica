/**
 * Generates optimized WebP assets for homepage (hero, decorative, product cards).
 *
 * Usage:
 *   npx tsx apps/web/scripts/optimize-homepage-images.ts
 *   npx tsx apps/web/scripts/optimize-homepage-images.ts --dry-run
 *   npx tsx apps/web/scripts/optimize-homepage-images.ts --upload   # push to R2 when creds set
 *   npx tsx apps/web/scripts/optimize-homepage-images.ts --from-api https://kovkasyanplennica.vercel.app
 *
 * Output:
 *   apps/web/public/assets/hero/optimized/*.webp
 *   apps/web/public/assets/optimized/ (nested paths)
 *   apps/web/lib/image-optimization-manifest.json
 */

import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import sharp from 'sharp';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const PUBLIC_ROOT = path.join(WEB_ROOT, 'public');
const MANIFEST_PATH = path.join(WEB_ROOT, 'lib', 'image-optimization-manifest.json');

const HERO_WIDTHS = [768, 1200, 1600] as const;
const CARD_WIDTHS = [400, 600, 800] as const;
const DECORATIVE_WIDTH = 900;
const WEBP_QUALITY = 82;

type ManifestEntry = {
  source: string;
  sourceBytes?: number;
  mime?: string;
  outputs: Array<{ key: string; width: number; bytes: number }>;
};

type Manifest = {
  generatedAt: string;
  entries: ManifestEntry[];
};

function loadEnv(): void {
  const repoRoot = path.resolve(WEB_ROOT, '..', '..');
  for (const p of [
    path.join(repoRoot, '.env'),
    path.join(repoRoot, 'env', '.env'),
    path.join(repoRoot, 'env', '.env.local'),
  ]) {
    dotenv.config({ path: p });
  }
}

function parseArgs(argv: string[]): {
  dryRun: boolean;
  upload: boolean;
  fromApi: string | null;
} {
  const fromApiIdx = argv.indexOf('--from-api');
  return {
    dryRun: argv.includes('--dry-run'),
    upload: argv.includes('--upload'),
    fromApi: fromApiIdx >= 0 ? argv[fromApiIdx + 1] ?? null : null,
  };
}

function detectMime(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return 'application/octet-stream';
}

async function encodeWebp(
  input: Buffer,
  width: number,
): Promise<{ buffer: Buffer; bytes: number }> {
  const buffer = await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
  return { buffer, bytes: buffer.length };
}

function ensureDirForFile(absPath: string): void {
  mkdirSync(path.dirname(absPath), { recursive: true });
}

async function writeOutput(
  absPath: string,
  buffer: Buffer,
  dryRun: boolean,
): Promise<void> {
  if (dryRun) return;
  ensureDirForFile(absPath);
  await writeFile(absPath, buffer);
}

function publicKeyFromAbs(absPath: string): string {
  return path.relative(PUBLIC_ROOT, absPath).split(path.sep).join('/');
}

async function processLocalFile(
  relFromPublic: string,
  widths: readonly number[],
  outputDirFn: (baseName: string, width: number) => string,
  manifest: Manifest,
  dryRun: boolean,
): Promise<void> {
  const abs = path.join(PUBLIC_ROOT, relFromPublic);
  if (!existsSync(abs)) {
    console.warn(`skip missing: ${relFromPublic}`);
    return;
  }

  const input = await readFile(abs);
  const mime = detectMime(input);
  const baseName = path.basename(relFromPublic, path.extname(relFromPublic));
  const entry: ManifestEntry = {
    source: relFromPublic,
    sourceBytes: input.length,
    mime,
    outputs: [],
  };

  for (const width of widths) {
    const relOut = outputDirFn(baseName, width);
    const absOut = path.join(PUBLIC_ROOT, relOut);
    const { buffer, bytes } = await encodeWebp(input, width);
    await writeOutput(absOut, buffer, dryRun);
    entry.outputs.push({ key: relOut.split(path.sep).join('/'), width, bytes });
    console.log(
      `${dryRun ? '[dry-run] ' : ''}${relFromPublic} → ${relOut} (${bytes} B, ${width}w)`,
    );
  }

  manifest.entries.push(entry);
}

async function processRemoteUrl(
  url: string,
  widths: readonly number[],
  manifest: Manifest,
  dryRun: boolean,
): Promise<void> {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(url).pathname.replace(/^\/+/, ''));
  } catch {
    console.warn(`skip invalid url: ${url}`);
    return;
  }

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`skip fetch ${res.status}: ${url}`);
    return;
  }

  const input = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get('content-type') ?? detectMime(input);
  const base = pathname.replace(/\.[^./\\]+$/, '');
  const entry: ManifestEntry = {
    source: url,
    sourceBytes: input.length,
    mime,
    outputs: [],
  };

  for (const width of widths) {
    const relOut = path.join('assets', 'optimized', `${base}-${width}w.webp`);
    const absOut = path.join(PUBLIC_ROOT, relOut);
    const { buffer, bytes } = await encodeWebp(input, width);
    await writeOutput(absOut, buffer, dryRun);
    entry.outputs.push({ key: relOut.split(path.sep).join('/'), width, bytes });
    console.log(
      `${dryRun ? '[dry-run] ' : ''}${url} → ${relOut} (${bytes} B, ${width}w)`,
    );
  }

  manifest.entries.push(entry);
}

async function fetchProductImageUrls(baseUrl: string): Promise<string[]> {
  const api = `${baseUrl.replace(/\/+$/, '')}/api/v1/products?page=1&limit=24&lang=ru`;
  const res = await fetch(api);
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${api}`);
  }
  const json = (await res.json()) as {
    data?: Array<{ image?: string | null }>;
  };
  const urls = new Set<string>();
  for (const row of json.data ?? []) {
    if (row.image && typeof row.image === 'string') {
      urls.add(row.image);
    }
  }
  return [...urls];
}

function createR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (!accountId || !bucket) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
    forcePathStyle: true,
  });
}

async function uploadManifestOutputs(
  manifest: Manifest,
  dryRun: boolean,
): Promise<void> {
  if (dryRun) {
    console.log('[dry-run] skip R2 upload');
    return;
  }

  const client = createR2Client();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (!client || !bucket) {
    console.log('R2 credentials missing — optimized files kept in public/ only');
    return;
  }

  const keys = new Set<string>();
  for (const entry of manifest.entries) {
    for (const out of entry.outputs) {
      keys.add(out.key);
    }
  }

  for (const key of keys) {
    const abs = path.join(PUBLIC_ROOT, ...key.split('/'));
    if (!existsSync(abs)) continue;
    const body = createReadStream(abs);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: 'image/webp',
      }),
    );
    console.log(`uploaded R2: ${key}`);
  }
}

async function main(): Promise<void> {
  loadEnv();
  const { dryRun, upload, fromApi } = parseArgs(process.argv.slice(2));
  const manifest: Manifest = { generatedAt: new Date().toISOString(), entries: [] };

  const staticHeroFiles = [
    'assets/hero/hero.png',
    'assets/hero/hero-pattern-figma.png',
    'assets/hero/union-decorative.png',
  ];

  for (const rel of staticHeroFiles) {
    const baseName = path.basename(rel, path.extname(rel));
    if (rel.includes('union-decorative')) {
      await processLocalFile(
        rel,
        [DECORATIVE_WIDTH],
        (_base, width) => path.join('assets', 'optimized', `assets/hero/${baseName}-${width}w.webp`),
        manifest,
        dryRun,
      );
    } else if (rel.includes('hero.png')) {
      await processLocalFile(
        rel,
        HERO_WIDTHS,
        (_base, width) => path.join('assets', 'hero', 'optimized', `${baseName}-${width}w.webp`),
        manifest,
        dryRun,
      );
    } else {
      await processLocalFile(
        rel,
        [1200],
        (_base, width) =>
          path.join('assets', 'hero', 'optimized', `${baseName}-${width}w.webp`),
        manifest,
        dryRun,
      );
    }
  }

  const carouselDir = path.join(PUBLIC_ROOT, 'assets', 'New folder');
  if (existsSync(carouselDir)) {
    const carouselFiles = readdirSync(carouselDir).filter((f) =>
      /\.(webp|jpe?g|png)$/i.test(f),
    );
    for (const name of carouselFiles) {
      const rel = path.join('assets', 'New folder', name);
      const base = path.basename(name, path.extname(name)).replace(/\s+/g, '-');
      await processLocalFile(
        rel,
        [800],
        (_b, width) =>
          path.join('assets', 'optimized', 'assets', 'New folder', `${base}-${width}w.webp`),
        manifest,
        dryRun,
      );
    }
  }

  const defaultProductUrls = [
    'https://pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev/menu/import/deserty/deserty-krasnyi-barhat-a1ca297a9e.jpg',
    'https://pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev/menu/import/deserty/deserty-medovik-s-sole-noi-karamelyu-dffbb5d49b.jpg',
    'https://pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev/menu/import/deserty/deserty-muravei-nik-a8a1189c69.jpg',
  ];

  let productUrls = defaultProductUrls;
  if (fromApi) {
    try {
      const fromProducts = await fetchProductImageUrls(fromApi);
      productUrls = [...new Set([...defaultProductUrls, ...fromProducts])];
      console.log(`Fetched ${fromProducts.length} product image URL(s) from API`);
    } catch (err) {
      console.warn('API fetch failed, using default dessert URLs only', err);
    }
  }

  for (const url of productUrls) {
    if (!/\.(jpe?g|png)$/i.test(url)) continue;
    await processRemoteUrl(url, CARD_WIDTHS, manifest, dryRun);
  }

  if (!dryRun) {
    writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`manifest: ${MANIFEST_PATH}`);
  }

  if (upload) {
    await uploadManifestOutputs(manifest, dryRun);
  }

  const totalOut = manifest.entries.reduce((s, e) => s + e.outputs.reduce((a, o) => a + o.bytes, 0), 0);
  const totalIn = manifest.entries.reduce((s, e) => s + (e.sourceBytes ?? 0), 0);
  console.log(
    `Done. sources=${manifest.entries.length} input≈${Math.round(totalIn / 1024)}KB output≈${Math.round(totalOut / 1024)}KB`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
