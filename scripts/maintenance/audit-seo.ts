import { PrismaClient } from "@prisma/client";
import { resolveProductMetaTitle } from "@/lib/seo";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Starting Advanced SEO Audit...\n");

  const [products, posts, categories] = await Promise.all([
    prisma.product.findMany({ where: { isVisible: { not: false } }, select: { id: true, name: true, slug: true, color: true, metaTitle: true, metaDesc: true, description: true, category: { select: { slug: true } } } }),
    prisma.post.findMany({ select: { id: true, title: true, slug: true, metaTitle: true, metaDesc: true, content: true } }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  const allSlugs = new Set([
    ...products.map(p => p.slug),
    ...posts.map(p => p.slug),
    ...categories.map(c => c.slug),
    "all", "blog", "about", "contacts", "delivery", "faq", "legal", "payment", "policy", "refund", "reviews", "service", "warranty", "wishlist", "cart", "checkout", "success"
  ]);

  // 1. Audit Metadata
  console.log("--- Metadata Audit ---");
  const missingMetaProducts = products.filter(p => !p.metaTitle || !p.metaDesc);
  const missingMetaPosts = posts.filter(p => !p.metaTitle || !p.metaDesc);

  console.log(`📦 Products with missing SEO: ${missingMetaProducts.length}`);
  missingMetaProducts.forEach(p => console.log(`  - [ID: ${p.id}] ${p.name}`));

  console.log(`📝 Posts with missing SEO: ${missingMetaPosts.length}`);
  missingMetaPosts.forEach(p => console.log(`  - [ID: ${p.id}] ${p.title}`));

  const duplicateValues = (field: "metaTitle" | "metaDesc") => {
    const groups = new Map<string, string[]>();
    products.forEach((product) => {
      const value = field === "metaTitle"
        ? resolveProductMetaTitle(product.metaTitle, product.name, product.color).trim()
        : product.metaDesc?.trim();
      if (!value) return;
      groups.set(value, [...(groups.get(value) ?? []), product.slug]);
    });
    return Array.from(groups.values()).filter((slugs) => slugs.length > 1);
  };

  const duplicateTitles = duplicateValues("metaTitle");
  const duplicateDescriptions = duplicateValues("metaDesc");
  console.log(`🏷️ Duplicate visible titles: ${duplicateTitles.reduce((total, group) => total + group.length, 0)}`);
  console.log(`📝 Duplicate visible descriptions: ${duplicateDescriptions.reduce((total, group) => total + group.length, 0)}`);

  // 2. Audit Internal Links
  console.log("\n--- Internal Link Audit ---");
  const linkRegex = /\[.*?\]\((?:\/|https?:\/\/gameshop24\.ru)(\/[a-zA-Z0-9\-\/]*)\)/g;

  const checkLinks = (text: string, sourceName: string) => {
    // Regex matches [text](/path) or [text](https://gameshop24.ru/path)
    const internalLinkRegex = /\[.*?\]\((?:\/|https?:\/\/gameshop24\.ru)([\w\-\/]+)\)/g;
    let match;
    const broken = [];
    while ((match = internalLinkRegex.exec(text)) !== null) {
      const path = match[1];
      // Normalize: path might or might not start with / depending on how prefix matched
      const fullPath = path.startsWith("/") ? path : "/" + path;
      const segments = fullPath.split("/").filter(Boolean);
      const targetSlug = segments[segments.length - 1];

      if (targetSlug && !allSlugs.has(targetSlug)) {
        broken.push(fullPath);
      }
    }
    if (broken.length > 0) {
      console.log(`❌ Broken links in "${sourceName}":`);
      broken.forEach(link => console.log(`  - ${link}`));
    }
  };

  posts.forEach(p => checkLinks(p.content, p.title));
  products.forEach(p => checkLinks(p.description || "", p.name));

  console.log("\n✅ Audit complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
