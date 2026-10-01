import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "tmp", "nintendo-news-generated");
const outputDir = path.join(root, "public", "images", "blog");

const images = [
  ["zelda.png", "news-zelda-oot-2026.webp"],
  ["metroid.png", "news-metroid-ravenous-2026.webp"],
  ["kirby.png", "news-kirby-world-beyond-2026.webp"],
  ["fire-emblem.png", "news-fire-emblem-fortunes-weave-2026.webp"],
  ["monster-hunter.png", "news-monster-hunter-wilds-switch-2-2026.webp"],
];

const bannerText = Buffer.from(`
<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" x2="1">
      <stop offset="0" stop-color="#07111f" stop-opacity="0.94"/>
      <stop offset="0.62" stop-color="#07111f" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#07111f" stop-opacity="0.08"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#shade)"/>
  <rect x="48" y="52" width="8" height="270" rx="4" fill="#e31e24"/>
  <text x="82" y="112" fill="#ffffff" font-family="Arial, sans-serif" font-size="30" font-weight="700">Gameshop24</text>
  <text x="82" y="180" fill="#ffffff" font-family="Arial, sans-serif" font-size="34" font-weight="700">Прошитые Nintendo Switch</text>
  <text x="82" y="228" fill="#ffdc4a" font-family="Arial, sans-serif" font-size="32" font-weight="700">с играми</text>
  <text x="82" y="292" fill="#ffffff" font-family="Arial, sans-serif" font-size="25" font-weight="600">Доставка по всей России</text>
  <text x="82" y="354" fill="#dce8f5" font-family="Arial, sans-serif" font-size="19">Гарантия магазина · Подбор игр · Поддержка</text>
</svg>`);

await fs.mkdir(outputDir, { recursive: true });

for (const [source, target] of images) {
  await sharp(path.join(sourceDir, source))
    .resize(800, 450, { fit: "cover", position: "centre" })
    .webp({ quality: 84 })
    .toFile(path.join(outputDir, target));
}

await sharp(path.join(sourceDir, "banner.png"))
  .resize(800, 450, { fit: "cover", position: "centre" })
  .composite([{ input: bannerText }])
  .webp({ quality: 84 })
  .toFile(path.join(outputDir, "gameshop24-switch-delivery-banner.webp"));

console.log(`Prepared ${images.length + 1} blog images in ${outputDir}`);
