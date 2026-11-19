import "dotenv/config";
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const BUCKET = process.env.S3_BUCKET;
const KEY_PREFIX = (process.env.S3_KEY_PREFIX ?? "").replace(/^\/+|\/+$/g, "");

if (!BUCKET || !process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !KEY_PREFIX) {
  console.error("❌ Missing required S3 env vars (S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_KEY_PREFIX)");
  process.exit(1);
}

const S3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "ru1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const MAX_BYTES = 70 * 1024; // 70 KB

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function compressToTarget(buffer, targetBytes) {
  const meta = await sharp(buffer).metadata();
  const format = meta.format === "png" ? "webp" : (meta.format ?? "webp");

  // Binary search for quality
  let lo = 10, hi = 90, best = null;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const out = await sharp(buffer)
      .webp({ quality: mid })
      .toBuffer();
    if (out.length <= targetBytes) {
      best = out;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  // If still too large at q=10, resize down
  if (!best) {
    let width = meta.width ?? 800;
    while (width > 100) {
      width = Math.floor(width * 0.8);
      const out = await sharp(buffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 60 })
        .toBuffer();
      if (out.length <= targetBytes) { best = out; break; }
    }
  }

  return best;
}

async function listAllKeys() {
  const keys = [];
  let token;
  do {
    const res = await S3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `${KEY_PREFIX}/`,
      ContinuationToken: token,
    }));
    for (const obj of res.Contents ?? []) {
      if (obj.Size > MAX_BYTES) keys.push({ key: obj.Key, size: obj.Size });
    }
    token = res.NextContinuationToken;
  } while (token);
  return keys;
}

async function main() {
  console.log("Listing S3 objects...");
  const large = await listAllKeys();
  console.log(`Found ${large.length} files > 70KB\n`);

  let compressed = 0, skipped = 0, failed = 0;
  let savedBytes = 0;

  for (let i = 0; i < large.length; i++) {
    const { key, size } = large[i];
    const pct = (((i + 1) / large.length) * 100).toFixed(1);
    process.stdout.write(`[${i + 1}/${large.length}] (${pct}%) ${key} (${(size / 1024).toFixed(0)}KB) → `);

    try {
      const { Body } = await S3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      const original = await streamToBuffer(Body);

      const result = await compressToTarget(original, MAX_BYTES);
      if (!result) {
        console.log("SKIP (cannot compress further)");
        skipped++;
        continue;
      }

      await S3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: result,
        ContentType: "image/webp",
        ACL: "public-read",
      }));

      const saved = size - result.length;
      savedBytes += saved;
      compressed++;
      console.log(`${(result.length / 1024).toFixed(0)}KB (saved ${(saved / 1024).toFixed(0)}KB)`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Done.`);
  console.log(`   Compressed: ${compressed}`);
  console.log(`   Skipped:    ${skipped}`);
  console.log(`   Failed:     ${failed}`);
  console.log(`   Total saved: ${(savedBytes / 1024 / 1024).toFixed(1)} MB`);
}

main().catch(console.error);
