/**
 * Uploads static images from apps/web/public to Cloudflare R2.
 * Skips logo and favicon files (they stay local).
 *
 * Required env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *               R2_BUCKET_NAME, R2_PUBLIC_URL
 *
 * Flags:
 *   --dry-run          list only
 *   --force            overwrite even if size matches
 *   --verify           HEAD-check uploaded keys on R2
 *   --cleanup-local    delete local images except logo/favicon (run after verify)
 */

import { createReadStream, existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IMAGE_EXT = new Set([
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.ico',
  '.avif',
  '.bmp',
]);

const REQUIRED_ENV = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
] as const;

function loadEnv(): void {
  const webRoot = path.resolve(__dirname, '..');
  const repoRoot = path.resolve(webRoot, '..', '..');
  for (const p of [
    path.join(repoRoot, '.env'),
    path.join(repoRoot, 'env', '.env'),
    path.join(webRoot, '.env'),
  ]) {
    dotenv.config({ path: p });
  }
}

function isLocalOnlyRelativePath(relPath: string): boolean {
  const base = path.basename(relPath).toLowerCase();
  if (base === 'favicon.png') return true;
  if (base === 'hero-logo.png') return true;
  if (base === 'logo-kp.png') return true;
  if (base === 'logo-kp2.png') return true;
  if (base === 'logo.png') return true;
  if (base === 'logo full.png') return true;
  return false;
}

function walkImageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkImageFiles(full));
    } else if (ent.isFile() && IMAGE_EXT.has(path.extname(ent.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

function guessContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
  };
  return map[ext] ?? 'application/octet-stream';
}

function parseArgs(argv: string[]): {
  dryRun: boolean;
  force: boolean;
  verify: boolean;
  cleanupLocal: boolean;
} {
  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    verify: argv.includes('--verify'),
    cleanupLocal: argv.includes('--cleanup-local'),
  };
}

function assertCredentials(): void {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]?.trim());
  if (missing.length > 0) {
    console.error(`Missing env: ${missing.join(', ')}`);
    process.exit(1);
  }
}

function createClient(accountId: string): S3Client {
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

async function headRemoteSize(
  client: S3Client,
  bucket: string,
  key: string
): Promise<number | undefined> {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return head.ContentLength;
  } catch {
    return undefined;
  }
}

async function main(): Promise<void> {
  loadEnv();
  const { dryRun, force, verify, cleanupLocal } = parseArgs(process.argv.slice(2));

  const webRoot = path.resolve(__dirname, '..');
  const publicRoot = path.join(webRoot, 'public');

  if (!existsSync(publicRoot)) {
    console.error(`Missing: ${publicRoot}`);
    process.exit(1);
  }

  if (!dryRun && !cleanupLocal) {
    assertCredentials();
  }

  const accountId = process.env.R2_ACCOUNT_ID?.trim() ?? '';
  const bucket = process.env.R2_BUCKET_NAME?.trim() ?? '';
  const publicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
  const client = !dryRun && accountId ? createClient(accountId) : null;

  const allImages = walkImageFiles(publicRoot);
  const toUpload = allImages.filter((abs) => {
    const rel = path.relative(publicRoot, abs).split(path.sep).join('/');
    return !isLocalOnlyRelativePath(rel);
  });
  const localOnly = allImages.filter((abs) => {
    const rel = path.relative(publicRoot, abs).split(path.sep).join('/');
    return isLocalOnlyRelativePath(rel);
  });

  console.log(`Images in public: ${allImages.length}`);
  console.log(`Upload to R2: ${toUpload.length}`);
  console.log(`Keep local (logo/favicon): ${localOnly.length}`);

  if (cleanupLocal) {
    let removed = 0;
    for (const abs of toUpload) {
      if (!existsSync(abs)) continue;
      unlinkSync(abs);
      removed += 1;
      console.log(`removed local: ${path.relative(publicRoot, abs)}`);
    }
    console.log(`Cleanup done. Removed ${removed} file(s). Kept ${localOnly.length} logo/favicon.`);
    return;
  }

  let uploaded = 0;
  let skipped = 0;
  const uploadedKeys: string[] = [];

  for (const abs of toUpload) {
    const relFromPublic = path.relative(publicRoot, abs).split(path.sep).join('/');
    const key = relFromPublic;
    const localSize = statSync(abs).size;
    const contentType = guessContentType(abs);

    if (dryRun) {
      console.log(`[dry-run] ${key} (${localSize} bytes)`);
      uploadedKeys.push(key);
      continue;
    }

    if (!client) continue;

    const remoteSize = await headRemoteSize(client, bucket, key);
    if (!force && remoteSize !== undefined && remoteSize === localSize) {
      skipped += 1;
      console.log(`skip: ${key}`);
      uploadedKeys.push(key);
      continue;
    }

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: createReadStream(abs),
        ContentType: contentType,
      })
    );
    uploaded += 1;
    uploadedKeys.push(key);
    console.log(`uploaded: ${key}`);
  }

  if (!dryRun && !cleanupLocal) {
    console.log(`Done. uploaded=${uploaded}, skipped=${skipped}`);
  }

  if (verify && !dryRun && client) {
    let failed = 0;
    for (const key of uploadedKeys) {
      const size = await headRemoteSize(client, bucket, key);
      if (size === undefined) {
        failed += 1;
        console.error(`VERIFY FAIL (missing): ${key}`);
      }
    }
    if (failed > 0) {
      console.error(`Verify failed: ${failed} missing object(s)`);
      process.exit(1);
    }
    console.log(`Verify OK: ${uploadedKeys.length} object(s) on R2`);

    const sample = uploadedKeys.slice(0, 3);
    for (const key of sample) {
      const url = `${publicUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`HTTP ${res.status}: ${url}`);
      if (!res.ok) failed += 1;
    }
    if (failed > 0) {
      console.error('Public URL check failed');
      process.exit(1);
    }
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
