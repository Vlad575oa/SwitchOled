import "dotenv/config";
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const execFileAsync = promisify(execFile);
const prisma = new PrismaClient();

const BUCKET = process.env.S3_BUCKET;
const ENDPOINT = process.env.S3_ENDPOINT;
const PUBLIC_URL = process.env.S3_PUBLIC_URL ?? ENDPOINT;
const KEY_PREFIX = (process.env.S3_KEY_PREFIX ?? "").replace(/^\/+|\/+$/g, "");

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

const toWebp = async (inputBuffer) => {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "s3-webp-"));
  const inPath = path.join(tmpDir, "in");
  const outPath = path.join(tmpDir, "out.webp");
  try {
    await fs.promises.writeFile(inPath, inputBuffer);
    await execFileAsync("cwebp", ["-lossless", inPath, "-o", outPath]);
    return await fs.promises.readFile(outPath);
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
};

const replaceExtWithWebp = (key) => key.replace(/\.(jpe?g|png)$/i, ".webp");

const oldUrlForKey = (key) => `${PUBLIC_URL}/${BUCKET}/${key}`;

async function listTargets() {
  const targets = [];
  const allKeys = new Set();
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${KEY_PREFIX}/`, ContinuationToken: token }));
    for (const obj of res.Contents ?? []) {
      const key = obj.Key ?? "";
      allKeys.add(key);
      if (/\.(jpe?g|png)$/i.test(key)) {
        targets.push({ key, size: obj.Size ?? 0 });
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return { targets, allKeys };
}

async function main() {
  const { targets, allKeys } = await listTargets();
  console.log(`Found ${targets.length} jpg/png objects in S3`);

  const urlMap = new Map();
  let converted = 0;
  let skippedExisting = 0;
  let failed = 0;
  let seen = 0;

  for (const t of targets) {
    seen += 1;
    const newKey = replaceExtWithWebp(t.key);
    try {
      if (allKeys.has(newKey)) {
        urlMap.set(oldUrlForKey(t.key), oldUrlForKey(newKey));
        skippedExisting += 1;
        if (seen % 20 === 0) {
          console.log(`Processed ${seen}/${targets.length} (converted ${converted}, skipped ${skippedExisting}, failed ${failed})`);
        }
        continue;
      }

      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: t.key }));
      const input = await streamToBuffer(obj.Body);
      const webp = await toWebp(input);

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: newKey,
        Body: webp,
        ContentType: "image/webp",
        ACL: "public-read",
      }));

      urlMap.set(oldUrlForKey(t.key), oldUrlForKey(newKey));
      converted += 1;
      if (seen % 20 === 0) {
        console.log(`Processed ${seen}/${targets.length} (converted ${converted}, skipped ${skippedExisting}, failed ${failed})`);
      }
    } catch (err) {
      failed += 1;
      console.error(`Failed: ${t.key} -> ${newKey}: ${err.message}`);
    }
  }

  console.log(`S3 conversion done. Converted: ${converted}, Skipped existing: ${skippedExisting}, Failed: ${failed}`);

  let updatedProducts = 0;
  const products = await prisma.product.findMany({ select: { id: true, images: true } });
  for (const p of products) {
    const next = p.images.map((u) => urlMap.get(u) ?? u);
    const changed = next.some((u, i) => u !== p.images[i]);
    if (changed) {
      await prisma.product.update({ where: { id: p.id }, data: { images: next } });
      updatedProducts += 1;
    }
  }

  let updatedPosts = 0;
  const posts = await prisma.post.findMany({ select: { id: true, image: true } });
  for (const post of posts) {
    if (!post.image) continue;
    const next = urlMap.get(post.image);
    if (next && next !== post.image) {
      await prisma.post.update({ where: { id: post.id }, data: { image: next } });
      updatedPosts += 1;
    }
  }

  console.log(`Updated DB. Products: ${updatedProducts}, Posts: ${updatedPosts}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
