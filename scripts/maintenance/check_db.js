const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getHeaders(url) {
  if (!url.startsWith('http')) return null;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      url,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
    };
  } catch (error) {
    return { url, error: error.message };
  }
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

async function main() {
  console.log("--- PUBLISHED PRODUCT CARDS (15 items) ---");
  const visibleProducts = await prisma.product.findMany({ 
    where: { isVisible: true }, 
    take: 15, 
    select: { id: true, name: true, images: true } 
  });
  
  for (const product of visibleProducts) {
    console.log(`Product: ${product.name}`);
    for (const img of product.images) {
      if (img.includes('s3.ru1.storage.beget.cloud')) {
        const info = await getHeaders(img);
        if (info && info.contentType) {
          console.log(`  - Image: format=${info.contentType}, size=${formatBytes(info.contentLength)} (${info.contentLength} bytes)`);
        }
      }
    }
  }

  console.log("\n--- UNPUBLISHED PRODUCT CARDS (3 items) ---");
  const hiddenProducts = await prisma.product.findMany({ 
    where: { isVisible: false }, 
    take: 3, 
    select: { id: true, name: true, images: true } 
  });
  
  for (const product of hiddenProducts) {
    console.log(`Product: ${product.name}`);
    for (const img of product.images) {
      if (img.includes('s3.ru1.storage.beget.cloud')) {
        const info = await getHeaders(img);
        if (info && info.contentType) {
          console.log(`  - Image: format=${info.contentType}, size=${formatBytes(info.contentLength)} (${info.contentLength} bytes)`);
        }
      }
    }
  }

  console.log("\n--- POST CARDS (Checking just in case) ---");
  const posts = await prisma.post.findMany({ take: 3, select: { title: true, image: true, isPublished: true } });
  for (const post of posts) {
     if (post.image && post.image.includes('s3.ru1.storage.beget.cloud')) {
        const info = await getHeaders(post.image);
        if (info && info.contentType) {
          console.log(`Post [Published: ${post.isPublished}]: ${post.title}`);
          console.log(`  - Image: format=${info.contentType}, size=${formatBytes(info.contentLength)} (${info.contentLength} bytes)`);
        }
     }
  }

}

main().finally(() => prisma.$disconnect());
