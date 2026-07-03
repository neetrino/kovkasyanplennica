/**
 * Generates 400w WebP thumbnails for all catalog product images and uploads to R2.
 *
 * Usage:
 *   npx tsx apps/web/scripts/optimize-catalog-images.ts
 *   npx tsx apps/web/scripts/optimize-catalog-images.ts --dry-run
 *   npx tsx apps/web/scripts/optimize-catalog-images.ts --upload
 *   npx tsx apps/web/scripts/optimize-catalog-images.ts --from-api https://kovkasyanplennica.vercel.app
 *
 * Outputs:
 *   apps/web/lib/image-optimization-manifest.json (merged)
 *   R2 keys: assets/optimized/menu/import/.../*-400w.webp (with --upload)
 *
 * Local cache (gitignored): apps/web/.cache/image-optimize/
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const CACHE_ROOT = path.join(WEB_ROOT, '.cache', 'image-optimize');
const MANIFEST_PATH = path.join(WEB_ROOT, 'lib', 'image-optimization-manifest.json');

const CARD_WIDTH = 400;
const WEBP_QUALITY = 90;
const PAGE_SIZE = 100;
const DEFAULT_API_BASE = 'https://kovkasyanplennica.vercel.app';

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
  for (const envPath of [
    path.join(repoRoot, '.env'),
    path.join(repoRoot, 'env', '.env'),
    path.join(repoRoot, 'env', '.env.local'),
  ]) {
    dotenv.config({ path: envPath });
  }
}

function parseArgs(argv: string[]): {
  dryRun: boolean;
  upload: boolean;
  fromApi: string;
} {
  const fromApiIdx = argv.indexOf('--from-api');
  return {
    dryRun: argv.includes('--dry-run'),
    upload: argv.includes('--upload'),
    fromApi:
      fromApiIdx >= 0 ? (argv[fromApiIdx + 1] ?? DEFAULT_API_BASE) : DEFAULT_API_BASE,
  };
}

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) {
    return { generatedAt: new Date().toISOString(), entries: [] };
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
}

function manifestHasSource(manifest: Manifest, source: string): boolean {
  return manifest.entries.some((e) => e.source === source);
}

function manifestHasOutputKey(manifest: Manifest, key: string): boolean {
  return manifest.entries.some((e) => e.outputs.some((o) => o.key === key));
}

async function encodeWebp(input: Buffer, width: number): Promise<{ buffer: Buffer; bytes: number }> {
  const buffer = await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
  return { buffer, bytes: buffer.length };
}

function buildOptimizedKey(sourcePath: string): string {
  const base = sourcePath.replace(/\.[^./\\]+$/, '');
  return `assets/optimized/${base}-${CARD_WIDTH}w.webp`;
}

function getR2PublicBase(): string {
  return (
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') ??
    process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, '') ??
    'https://pub-4f7faa05c8fb4cdc9799891c76849ee9.r2.dev'
  );
}

/** menu/import/... base path without extension, from original or optimized image URL. */
function normalizeToSourceBase(imageUrl: string): string | null {
  try {
    let pathname = decodeURIComponent(new URL(imageUrl).pathname.replace(/^\/+/, ''));
    if (pathname.startsWith('assets/optimized/')) {
      pathname = pathname.replace(/^assets\/optimized\//, '');
      pathname = pathname.replace(/-\d+w\.webp$/i, '');
    } else {
      pathname = pathname.replace(/\.[^./\\]+$/, '');
    }
    return pathname.startsWith('menu/import/') ? pathname : null;
  } catch {
    return null;
  }
}

async function fetchOriginalForSourceBase(
  sourceBase: string,
): Promise<{ buffer: Buffer; mime: string; sourceUrl: string } | null> {
  const r2Base = getR2PublicBase();
  for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
    const sourceUrl = `${r2Base}/${sourceBase}.${ext}`;
    const res = await fetch(sourceUrl);
    if (!res.ok) continue;
    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      mime: res.headers.get('content-type') ?? 'image/jpeg',
      sourceUrl,
    };
  }
  console.warn(`skip — original not found for ${sourceBase}`);
  return null;
}

async function fetchAllProductImageUrls(baseUrl: string): Promise<string[]> {
  const sourceBases = new Set<string>();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const api = `${baseUrl.replace(/\/+$/, '')}/api/v1/products?page=${page}&limit=${PAGE_SIZE}&lang=ru`;
    const res = await fetch(api);
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${api}`);
    }
    const json = (await res.json()) as {
      data?: Array<{ image?: string | null }>;
      meta?: { totalPages?: number };
    };
    for (const row of json.data ?? []) {
      if (row.image && typeof row.image === 'string') {
        const base = normalizeToSourceBase(row.image);
        if (base) sourceBases.add(base);
      }
    }
    totalPages = json.meta?.totalPages ?? page;
    page += 1;
  }

  return [...sourceBases];
}

function createR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

async function uploadToR2(
  client: S3Client,
  bucket: string,
  key: string,
  buffer: Buffer,
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
    }),
  );
}

async function processSourceBase(
  sourceBase: string,
  manifest: Manifest,
  dryRun: boolean,
  upload: boolean,
  r2Client: S3Client | null,
  bucket: string | undefined,
): Promise<void> {
  const optimizedKey = buildOptimizedKey(sourceBase);

  if (manifestHasOutputKey(manifest, optimizedKey)) {
    console.log(`skip existing output key: ${optimizedKey}`);
    return;
  }

  const original = await fetchOriginalForSourceBase(sourceBase);
  if (!original) return;

  if (manifestHasSource(manifest, original.sourceUrl)) {
    console.log(`skip existing manifest source: ${original.sourceUrl}`);
    return;
  }

  const { buffer, bytes } = await encodeWebp(original.buffer, CARD_WIDTH);
  const entry: ManifestEntry = {
    source: original.sourceUrl,
    sourceBytes: original.buffer.length,
    mime: original.mime,
    outputs: [{ key: optimizedKey, width: CARD_WIDTH, bytes }],
  };

  if (!dryRun) {
    mkdirSync(path.dirname(path.join(CACHE_ROOT, optimizedKey)), { recursive: true });
    const cachePath = path.join(CACHE_ROOT, optimizedKey);
    await writeFile(cachePath, buffer);

    if (upload && r2Client && bucket) {
      await uploadToR2(r2Client, bucket, optimizedKey, buffer);
      console.log(`uploaded R2: ${optimizedKey} (${bytes} B) ← ${original.sourceUrl}`);
    } else {
      console.log(`cached: ${optimizedKey} (${bytes} B)`);
    }
  } else {
    console.log(`[dry-run] ${original.sourceUrl} → ${optimizedKey} (${bytes} B)`);
  }

  manifest.entries.push(entry);
}

async function verifyR2Keys(keys: string[]): Promise<void> {
  const base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') ??
    process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, '');
  if (!base) {
    console.log('skip R2 verify — no public base URL in env');
    return;
  }

  let ok = 0;
  let missing = 0;
  for (const key of keys) {
    const res = await fetch(`${base}/${key}`, { method: 'HEAD' });
    if (res.ok) {
      ok += 1;
    } else {
      missing += 1;
      console.warn(`R2 verify FAIL ${res.status}: ${key}`);
    }
  }
  console.log(`R2 verify: ${ok} ok, ${missing} missing (${keys.length} total)`);
}

async function main(): Promise<void> {
  loadEnv();
  const { dryRun, upload, fromApi } = parseArgs(process.argv.slice(2));
  const manifest = loadManifest();
  const existingKeys = new Set(
    manifest.entries.flatMap((e) => e.outputs.map((o) => o.key)),
  );

  console.log(`Fetching catalog images from ${fromApi} ...`);
  const imageUrls = await fetchAllProductImageUrls(fromApi);
  console.log(`Found ${imageUrls.length} unique catalog source image(s)`);

  const r2Client = upload ? createR2Client() : null;
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (upload && !r2Client) {
    console.warn('R2 credentials missing — generating cache + manifest only');
  }

  for (const sourceBase of imageUrls) {
    await processSourceBase(sourceBase, manifest, dryRun, upload, r2Client, bucket);
  }

  if (!dryRun) {
    manifest.generatedAt = new Date().toISOString();
    writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`manifest updated: ${MANIFEST_PATH} (${manifest.entries.length} entries)`);

    const newKeys = manifest.entries
      .flatMap((e) => e.outputs.map((o) => o.key))
      .filter((k) => !existingKeys.has(k));
    if (newKeys.length > 0) {
      await verifyR2Keys(newKeys);
    }
  }

  const totalOut = manifest.entries.reduce(
    (sum, e) => sum + e.outputs.reduce((a, o) => a + o.bytes, 0),
    0,
  );
  console.log(`Done. manifest entries=${manifest.entries.length} total output≈${Math.round(totalOut / 1024)}KB`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
