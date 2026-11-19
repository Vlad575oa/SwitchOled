const { PrismaClient } = require('@prisma/client');
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const dotenv = require('dotenv');
const { Readable } = require('stream');

dotenv.config();

const prisma = new PrismaClient();

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET;
const KEY_PREFIX = (process.env.S3_KEY_PREFIX ?? '').replace(/^\/+|\/+$/g, '');

if (!KEY_PREFIX) {
  console.error('❌ Не задан S3_KEY_PREFIX в .env');
  process.exit(1);
}

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function convertAndReplace() {
  const products = await prisma.product.findMany({
    where: { isVisible: true },
    take: 15,
  });

  for (const product of products) {
    console.log(`Processing product: ${product.name}`);
    const updatedImages = [];
    let modified = false;

    for (const imageUrl of product.images) {
      if (!imageUrl.includes('s3.ru1.storage.beget.cloud') || imageUrl.endsWith('.webp')) {
        updatedImages.push(imageUrl);
        continue;
      }

      try {
        // Extract key from URL
        const urlObj = new URL(imageUrl);
        let key = urlObj.pathname.substring(1); // Remove leading slash
        // If pathname starts with bucket name (path-style), remove it
        if (key.startsWith(BUCKET + '/')) {
            key = key.replace(BUCKET + '/', '');
        }
        // Never touch (and especially never delete) another project's objects
        if (!key.startsWith(KEY_PREFIX + '/')) {
          console.log(`  Skipping foreign key: ${key}`);
          updatedImages.push(imageUrl);
          continue;
        }

        console.log(`  Downloading: ${key}`);
        
        const getObj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
        const buffer = await streamToBuffer(getObj.Body);

        console.log(`  Converting to WebP...`);
        const webpBuffer = await sharp(buffer)
          .webp({ quality: 85 }) // High quality as requested
          .toBuffer();

        const newKey = key.replace(/\.[^/.]+$/, "") + ".webp";
        const newUrl = `${process.env.S3_PUBLIC_URL}/${BUCKET}/${newKey}`;

        console.log(`  Uploading: ${newKey}`);
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: newKey,
          Body: webpBuffer,
          ContentType: 'image/webp',
        }));

        console.log(`  Deleting old file: ${key}`);
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));

        updatedImages.push(newUrl);
        modified = true;
      } catch (err) {
        console.error(`  Error processing ${imageUrl}:`, err.message);
        updatedImages.push(imageUrl);
      }
    }

    if (modified) {
      await prisma.product.update({
        where: { id: product.id },
        data: { images: updatedImages },
      });
      console.log(`  Database updated for ${product.name}`);
    }
  }
}

convertAndReplace()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
