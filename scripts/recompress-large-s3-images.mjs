import "dotenv/config";
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const execFileAsync = promisify(execFile);

const BUCKET = process.env.S3_BUCKET;
const ENDPOINT = process.env.S3_ENDPOINT;
const KEY_PREFIX = (process.env.S3_KEY_PREFIX ?? "").replace(/^\/+|\/+$/g, "");
const SIZE_THRESHOLD = 100 * 1024; // 100KB
const QUALITY = 82;

if (!BUCKET || !ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY || !KEY_PREFIX) {
  console.error("❌ Missing required S3 env vars");
  process.exit(1);
}

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "ru1",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const toWebpLossy = async (inputBuffer, ext) => {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "s3-recompress-"));
  const inPath = path.join(tmpDir, `in.${ext}`);
  const outPath = path.join(tmpDir, "out.webp");
  try {
    await fs.promises.writeFile(inPath, inputBuffer);
    await execFileAsync("cwebp", ["-q", String(QUALITY), inPath, "-o", outPath]);
    return await fs.promises.readFile(outPath);
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
};

const getExt = (key) => key.split(".").pop().toLowerCase();
const toWebpKey = (key) => key.replace(/\.(jpe?g|png|webp)$/i, ".webp");

async function main() {
  // List all objects
  const targets = [];
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${KEY_PREFIX}/`, ContinuationToken: token }));
    for (const obj of res.Contents ?? []) {
      const key = obj.Key ?? "";
      const ext = getExt(key);
      if (obj.Size > SIZE_THRESHOLD && /^(jpe?g|png|webp)$/.test(ext)) {
        targets.push({ key, size: obj.Size, ext });
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  console.log(`Found ${targets.length} images > 100KB to recompress`);

  let done = 0, failed = 0, skipped = 0;

  for (const t of targets) {
    const outKey = toWebpKey(t.key);
    try {
      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: t.key }));
      const inputBuf = await streamToBuffer(obj.Body);

      const webpBuf = await toWebpLossy(inputBuf, t.ext);

      const savedKB = ((t.size - webpBuf.length) / 1024).toFixed(0);
      if (webpBuf.length >= t.size) {
        console.log(`SKIP (no gain) ${t.key} ${(t.size/1024).toFixed(0)}KB`);
        skipped++;
        continue;
      }

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: outKey,
        Body: webpBuf,
        ContentType: "image/webp",
        ACL: "public-read",
      }));

      console.log(`✓ ${outKey} ${(t.size/1024).toFixed(0)}KB → ${(webpBuf.length/1024).toFixed(0)}KB (saved ${savedKB}KB)`);
      done++;
    } catch (err) {
      console.error(`✗ ${t.key}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${done} recompressed, ${skipped} skipped (no gain), ${failed} failed`);
}

main().catch((e) => { console.error(e); process.exit(1); });
