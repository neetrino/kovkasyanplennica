import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "json", "WEBP PHOTOS");
const mappingPath = path.join(rootDir, "json", "r2_webp_upload_map.json");
const menuSourcePath = path.join(rootDir, "json", "menu_for_review_columns.json");
const menuR2Path = path.join(rootDir, "json", "menu_for_review_columns_r2.json");

dotenv.config({ path: path.join(rootDir, ".env") });

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicBaseUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
  throw new Error(
    "Missing required R2 env vars (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL)"
  );
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

function toNumericFilenameSort(a, b) {
  const aNum = Number.parseInt(path.parse(a).name, 10);
  const bNum = Number.parseInt(path.parse(b).name, 10);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return aNum - bNum;
  }
  return a.localeCompare(b);
}

function buildMenuWithR2Urls(menuRows, numberToUrl) {
  return menuRows.map((row) => {
    const imageNumbersAllRaw = String(row.image_numbers_all || "").trim();
    const imageNumbers = imageNumbersAllRaw
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean);

    const mainImageNumber = String(row.image_number || "").trim();
    const mainImageUrl = mainImageNumber ? numberToUrl[mainImageNumber] || "" : "";
    const allImageUrls = imageNumbers
      .map((n) => numberToUrl[n] || "")
      .filter(Boolean);

    return {
      ...row,
      image_path: mainImageUrl || row.image_path || "",
      image_paths_all: allImageUrls.join(";"),
      image_url: mainImageUrl || "",
      image_urls: allImageUrls,
    };
  });
}

async function main() {
  const allFiles = await readdir(sourceDir);
  const webpFiles = allFiles.filter((f) => f.toLowerCase().endsWith(".webp")).sort(toNumericFilenameSort);

  if (webpFiles.length === 0) {
    throw new Error(`No .webp files found in: ${sourceDir}`);
  }

  const numberToUrl = {};
  let uploaded = 0;

  for (const fileName of webpFiles) {
    const fullPath = path.join(sourceDir, fileName);
    const fileBuffer = await readFile(fullPath);
    const key = `menu/webp/${fileName}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: "image/webp",
      })
    );

    const fileNumber = path.parse(fileName).name;
    const url = `${publicBaseUrl}/${key}`;
    numberToUrl[fileNumber] = url;
    uploaded += 1;
    console.log(`[${uploaded}/${webpFiles.length}] uploaded ${fileName}`);
  }

  await writeFile(
    mappingPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        bucket,
        prefix: "menu/webp/",
        totalUploaded: uploaded,
        numberToUrl,
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  try {
    const menuRows = JSON.parse(await readFile(menuSourcePath, "utf8"));
    if (Array.isArray(menuRows)) {
      const updatedRows = buildMenuWithR2Urls(menuRows, numberToUrl);
      await writeFile(`${menuR2Path}`, `${JSON.stringify(updatedRows, null, 2)}\n`, "utf8");
      console.log(`menu json with R2 urls: ${menuR2Path}`);
    }
  } catch {
    console.log("menu_for_review_columns.json not updated (file missing or invalid JSON)");
  }

  console.log(`upload complete: ${uploaded} files`);
  console.log(`mapping json: ${mappingPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
