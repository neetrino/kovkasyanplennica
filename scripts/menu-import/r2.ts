import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { contentTypeForExt, type LocalMenuImage } from "./images";
import { slugify } from "./normalize";

const PLACEHOLDER_KEY = "menu/placeholders/box-icon.svg";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

export function readR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() ?? "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "";
  const bucketName = process.env.R2_BUCKET_NAME?.trim() ?? "";
  const publicUrl = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error(
      "Missing R2 env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL"
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

function getClient(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function ensurePlaceholderUrl(config: R2Config): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" fill="none"><rect width="800" height="800" rx="48" fill="#F6F7FB"/><rect x="160" y="230" width="480" height="340" rx="24" fill="#E9ECF5"/><path d="M400 148 620 260 400 372 180 260 400 148Z" fill="#C8D0E3"/></svg>`;
  const client = getClient(config);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: PLACEHOLDER_KEY,
      Body: Buffer.from(svg, "utf8"),
      ContentType: "image/svg+xml",
    })
  );
  return `${config.publicUrl}/${PLACEHOLDER_KEY}`;
}

function buildObjectKey(image: LocalMenuImage, categorySlug: string): string {
  const hash = createHash("sha1").update(image.relativePath).digest("hex").slice(0, 10);
  const safeName = slugify(`${categorySlug}-${image.stem}`).slice(0, 40) || "image";
  const ext = image.ext || ".webp";
  return `menu/import/${categorySlug}/${safeName}-${hash}${ext}`;
}

export async function uploadMenuImages(
  images: LocalMenuImage[],
  categorySlugByFolder: Map<string, string>,
  config: R2Config,
  dryRun: boolean
): Promise<Map<string, string>> {
  const urlByRelativePath = new Map<string, string>();
  const client = getClient(config);

  for (const image of images) {
    const categorySlug = categorySlugByFolder.get(image.categoryFolder) ?? slugify(image.categoryFolder);
    const key = buildObjectKey(image, categorySlug);
    const publicUrl = `${config.publicUrl}/${key}`;

    if (dryRun) {
      urlByRelativePath.set(image.relativePath, publicUrl);
      continue;
    }

    const body = await fs.readFile(image.absolutePath);
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: body,
        ContentType: contentTypeForExt(image.ext),
      })
    );
    urlByRelativePath.set(image.relativePath, publicUrl);
  }

  return urlByRelativePath;
}

export function buildSku(categorySlug: string, productSlug: string, index: number): string {
  const source = `${categorySlug}-${productSlug}-${index}`;
  const hash = createHash("sha1").update(source).digest("hex").slice(0, 8).toUpperCase();
  return `MENU-${hash}`;
}
