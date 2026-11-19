import "dotenv/config";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
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

const MAX_BYTES = 50 * 1024; // 50 KB

// Keys are relative to the project prefix: "<S3_KEY_PREFIX>/products/..."
const KEYS = [
  "products/1778246264597-27f8906d-7494-4a72-b746-94501f9bb59e.webp",
  "products/1778246265530-936dfb44-98dc-4df4-bcb3-e5ed1ac8d3fe.webp",
  "products/1778227136223-c974657c-e180-4d77-b762-e2fa55b6c330.webp",
  "products/1778246990351-848af6ef-033b-42a5-a12d-a86750669d04.webp",
  "products/1778246789890-9290133f-549e-4939-b7b2-67809733d6bd.webp",
  "products/1778247133530-19674206-63ff-40d7-8309-4d5383e33fcb.webp",
  "products/1778248531958-b7f90c93-cd59-42b2-9d6f-fc64e7eb6a63.webp",
  "products/1778247744189-3a3fb4e2-f74c-4c2a-aa23-c6e901bd6008.webp",
  "products/1778247744902-12ff929a-714a-431a-a7ba-f23bc6967e65.webp",
  "products/1778244531625-9fa07211-0ec6-4e83-abdb-516f71cde68e.webp",
  "products/1778245133776-1e26f2cb-eff3-4589-899b-26f60bc6e165.webp",
  "products/1778247970990-d632f904-20d3-4e4b-b244-a508cc3f6f63.webp",
  "products/1778244961548-79094478-2d1c-4afe-8638-a869691c9804.webp",
  "products/1778245879903-44dcb69c-302e-4467-8649-5de7e00e950a.webp",
  "products/1778245609252-a062ddf4-78b6-4b74-b85f-4a1192d1e208.webp",
  "products/1778246594693-3cea34cc-1b91-4bcf-a36d-8f630b498909.webp",
  "products/1778168025262-1a34cb21-91ec-413e-81ee-70eeb4971a00.webp",
  "products/1778168024129-6a531057-46fb-4d6d-8cf3-7d9ee21b91f0.webp",
  "products/1778248532819-97161693-18d2-47b3-a2a9-06000d5cbbc1.webp",
  "products/1778168030254-db9703b1-36f2-4291-bdee-de9947c3fc8c.webp",
  "products/1778168028782-38e8d101-edf3-43a4-ac52-5eda374e143d.webp",
  "products/1778243828124-9f77da08-0c7c-441a-97f3-8898668b4b12.webp",
  "products/1778168022724-1fcc086d-2bc7-491d-84f7-aed4e5ddf1d5.webp",
  "products/1778245609875-47b943b6-4965-4429-89c1-9fb67b5b7bd7.webp",
  "products/1778247430483-77d9e5a5-fe99-4736-ae14-9d95b1d600fa.webp",
  "products/1778248534066-14ce3fb8-3b5f-40ad-9077-921788fe4e0d.webp",
  "products/1778237833125-293c10d8-8d28-4b1d-91b0-3c7530828712.webp",
  "products/1778168023254-b1410c54-b17f-470b-9e1d-5becf8a252d7.webp",
  "products/1778168021916-9af1766c-78fd-4a66-8982-bd70090964d9.webp",
  "products/1778238885713-1033efba-ea4b-4472-828c-badafd0eb34c.webp",
  "products/1778248533555-fc6e700a-e2e3-4c07-8af3-a5af08c4b4c8.webp",
  "products/1778168021129-6676b128-a15e-486f-a3f7-e84e95b4a853.webp",
  "products/1778168019568-addf89e7-fbc4-4247-8f75-881bfe97377c.webp",
  "products/1778248536069-24eda6ba-7e6d-43cc-8c83-3b9be721e1b5.webp",
  "products/1778243668649-cea13bf1-98bc-4a31-acef-4372259d1956.webp",
  "products/1778168026033-8c447e3d-e387-4e3a-90f5-c2e50816b998.webp",
  "products/1778168032196-09ab6649-15eb-4ec6-a9d3-6f6b29c5dbde.webp",
  "products/1778168030917-a3c212b6-946d-4855-b94e-800e437b25ce.webp",
  "products/1778168033367-3da3edab-c195-4549-a00c-8b07fdd96d09.webp",
  "products/1778168027412-f782a2d3-8daf-4b03-849e-6df1a512d513.webp",
];

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function compressToTarget(buffer, targetBytes) {
  let lo = 10, hi = 85, best = null;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const out = await sharp(buffer).webp({ quality: mid }).toBuffer();
    if (out.length <= targetBytes) {
      best = out;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (!best) {
    const meta = await sharp(buffer).metadata();
    let width = meta.width ?? 800;
    while (width > 100) {
      width = Math.floor(width * 0.85);
      const out = await sharp(buffer).resize({ width }).webp({ quality: 70 }).toBuffer();
      if (out.length <= targetBytes) { best = out; break; }
    }
  }
  return best;
}

async function main() {
  console.log(`Compressing ${KEYS.length} grid images to ≤50KB...\n`);
  let saved = 0;

  for (let i = 0; i < KEYS.length; i++) {
    const key = `${KEY_PREFIX}/${KEYS[i]}`;
    process.stdout.write(`[${i + 1}/${KEYS.length}] ${key.split("/").pop()} → `);
    try {
      const { Body, ContentLength } = await S3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      const buf = await streamToBuffer(Body);
      const result = await compressToTarget(buf, MAX_BYTES);
      if (!result) { console.log("SKIP"); continue; }
      await S3.send(new PutObjectCommand({
        Bucket: BUCKET, Key: key, Body: result,
        ContentType: "image/webp", ACL: "public-read",
      }));
      const s = buf.length - result.length;
      saved += s;
      console.log(`${(result.length / 1024).toFixed(1)}KB (saved ${(s / 1024).toFixed(1)}KB)`);
    } catch (e) { console.log(`ERROR: ${e.message}`); }
  }

  console.log(`\n✅ Done. Total saved: ${(saved / 1024).toFixed(0)}KB`);
}

main().catch(console.error);
