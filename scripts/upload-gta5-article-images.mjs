// Run: node scripts/upload-gta5-article-images.mjs
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "fs/promises";
import { config } from "dotenv";

config({ path: ".env" });

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "ru1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY },
  forcePathStyle: true,
});

const files = [
  "images/blog/gta5-switch-oled-article-hero.webp",
  "images/blog/gta5-switch-oled-promo.webp",
];

for (const key of files) {
  const buf = await readFile("public/" + key);
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buf,
    ContentType: "image/webp",
    ACL: "public-read",
  }));
  console.log("Uploaded:", `${process.env.S3_PUBLIC_URL}/${process.env.S3_BUCKET}/${key}`);
}
