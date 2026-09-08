// Run: node scripts/upload-gta5-image.mjs
// Uploads the GTA5/Switch OLED blog cover image to S3

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "fs/promises";
import { config } from "dotenv";

config({ path: ".env" });

const BUCKET = process.env.S3_BUCKET;
const ENDPOINT = process.env.S3_ENDPOINT;
const PUBLIC_URL = process.env.S3_PUBLIC_URL ?? ENDPOINT;
const ACCESS_KEY = process.env.S3_ACCESS_KEY;
const SECRET_KEY = process.env.S3_SECRET_KEY;

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "ru1",
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  forcePathStyle: true,
});

const key = "images/blog/gta5-switch-oled-nintendo-switch.webp";
const filePath = "public/" + key;
const buf = await readFile(filePath);

await s3.send(new PutObjectCommand({
  Bucket: BUCKET,
  Key: key,
  Body: buf,
  ContentType: "image/webp",
  ACL: "public-read",
}));

const s3Url = `${PUBLIC_URL}/${BUCKET}/${key}`;
console.log("Uploaded:", s3Url);
