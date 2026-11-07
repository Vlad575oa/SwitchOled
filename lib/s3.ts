import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import sharp from "sharp";
import { buildS3ObjectUrl } from "./imageUrls";

const BUCKET = process.env.S3_BUCKET!;
const ENDPOINT = process.env.S3_ENDPOINT!;
const PUBLIC_URL = process.env.S3_PUBLIC_URL ?? ENDPOINT;

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "ru1",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const MAX_SIZE = 5 * 1024 * 1024;

const FORMAT_TO_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function uploadImagesToS3(
  files: File[],
  folder: "products" | "posts"
): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    if (file.size > MAX_SIZE) {
      throw new Error("Файл слишком большой. Максимум 5MB");
    }

    const buf = Buffer.from(await file.arrayBuffer());

    // Verify the actual file content (magic bytes), not the client-supplied
    // MIME type or filename — a spoofed Content-Type could smuggle arbitrary
    // files (e.g. HTML/SVG with scripts) into public storage otherwise.
    let format: string | undefined;
    try {
      const metadata = await sharp(buf).metadata();
      format = metadata.format;
    } catch {
      throw new Error("Недопустимый формат файла. Разрешены JPG/PNG/WEBP");
    }

    const mime = format ? FORMAT_TO_MIME[format] : undefined;
    if (!mime) {
      throw new Error("Недопустимый формат файла. Разрешены JPG/PNG/WEBP");
    }

    const ext = format === "png" ? "png" : format === "webp" ? "webp" : "jpg";
    const key = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buf,
        ContentType: mime,
        ACL: "public-read",
      })
    );

    urls.push(buildS3ObjectUrl(PUBLIC_URL, BUCKET, key));
  }

  return urls;
}
