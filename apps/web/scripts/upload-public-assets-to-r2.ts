/**
 * Uploads apps/web/public/assets/** to Cloudflare R2 with keys assets/... (no public/ prefix).
 *
 * Required env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 * Optional: R2_UPLOAD_PREFIX (default empty; keys are always under assets/ from public/)
 *
 * Flags: --dry-run (list only), --force (overwrite even if size matches)
 */

import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REQUIRED_ENV = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
] as const;

function loadEnv(): void {
  const webRoot = path.resolve(__dirname, '..');
  const repoRoot = path.resolve(webRoot, '..', '..');
  const candidates = [
    path.join(repoRoot, '.env'),
    path.join(repoRoot, 'env', '.env'),
    path.join(repoRoot, 'env', '.env.local'),
    path.join(webRoot, '.env'),
  ];
  for (const p of candidates) {
    dotenv.config({ path: p });
  }
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkFiles(full));
    } else if (ent.isFile()) {
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
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return map[ext] ?? 'application/octet-stream';
}

function parseArgs(argv: string[]): { dryRun: boolean; force: boolean } {
  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
  };
}

function assertCredentials(): void {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]?.trim());
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Set them in your shell or in the repo root .env file, then retry.\n' +
        'Optional: R2_UPLOAD_PREFIX (advanced; default keeps keys as assets/... under the bucket root).'
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  loadEnv();
  const { dryRun, force } = parseArgs(process.argv.slice(2));

  const webRoot = path.resolve(__dirname, '..');
  const publicRoot = path.join(webRoot, 'public');
  const assetsRoot = path.join(publicRoot, 'assets');

  if (!existsSync(assetsRoot)) {
    console.error(`Expected directory missing: ${assetsRoot}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log('[dry-run] Would read credentials and upload from:', assetsRoot);
  } else {
    assertCredentials();
  }

  const accountId = process.env.R2_ACCOUNT_ID?.trim() ?? '';
  const bucket = process.env.R2_BUCKET_NAME?.trim() ?? '';
  const prefix = (process.env.R2_UPLOAD_PREFIX ?? '').replace(/^\/+|\/+$/g, '');

  const client =
    !dryRun && accountId
      ? new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
          },
          forcePathStyle: true,
        })
      : null;

  const files = walkFiles(assetsRoot);
  let uploaded = 0;
  let skipped = 0;

  for (const abs of files) {
    const relFromPublic = path.relative(publicRoot, abs).split(path.sep).join('/');
    const key = prefix ? `${prefix}/${relFromPublic}` : relFromPublic;

    if (!key.startsWith('assets/')) {
      console.error(`Refusing unexpected key (must start with assets/): ${key}`);
      process.exit(1);
    }

    const localSize = statSync(abs).size;
    const contentType = guessContentType(abs);

    if (dryRun) {
      console.log(`[dry-run] ${key} (${localSize} bytes, ${contentType})`);
      continue;
    }

    if (!client) {
      continue;
    }

    let remoteSize: number | undefined;
    try {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key })
      );
      remoteSize = head.ContentLength;
    } catch {
      remoteSize = undefined;
    }

    if (!force && remoteSize !== undefined && remoteSize === localSize) {
      skipped += 1;
      console.log(`skip (same size): ${key}`);
      continue;
    }

    const body = createReadStream(abs);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    uploaded += 1;
    console.log(`uploaded: ${key}`);
  }

  if (dryRun) {
    console.log(`[dry-run] ${files.length} file(s). Run without --dry-run after setting credentials.`);
    return;
  }

  console.log(`Done. uploaded=${uploaded}, skipped=${skipped}, total=${files.length}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
