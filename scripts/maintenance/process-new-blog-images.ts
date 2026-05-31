import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

const images = [
  {
    src: "/Users/vladislavolejnik/Downloads/Nintendo Switch OLED или Lite.png",
    id: 72,
    name: "nintendo-switch-oled-vs-lite.webp"
  },
  {
    src: "/Users/vladislavolejnik/Downloads/Как выбрать Nintendo Switch в 2026 году.png",
    id: 73,
    name: "kak-vybrat-nintendo-switch-2026.webp"
  },
  {
    src: "/Users/vladislavolejnik/Downloads/Nintendo Switch в подарок.png",
    id: 74,
    name: "nintendo-switch-gift-guide.webp"
  }
];

const targetDir = path.join(process.cwd(), "public/uploads/blog");

async function main() {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const img of images) {
    const targetPath = path.join(targetDir, img.name);
    console.log(`Processing: ${img.src} -> ${targetPath}`);

    try {
      await sharp(img.src)
        .resize(1200, 630, { fit: "cover" }) // Perfect for OG and hero
        .webp({ quality: 80 })
        .toFile(targetPath);

      const publicUrl = `/uploads/blog/${img.name}`;
      await prisma.post.update({
        where: { id: img.id },
        data: { image: publicUrl }
      });

      console.log(`✅ Updated post ${img.id} with ${publicUrl}`);
    } catch (err: any) {
      console.error(`❌ Failed to process ${img.name}:`, err.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
