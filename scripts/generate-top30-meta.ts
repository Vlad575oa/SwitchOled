import prisma from "@/lib/prisma";
import { buildProductMetaDescription, buildProductMetaTitle, truncateByWords } from "@/lib/seo";

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const products = await prisma.product.findMany({
    where: { isVisible: { not: false } },
    include: { category: true },
    orderBy: [{ inStock: "desc" }, { stock: "desc" }, { updatedAt: "desc" }],
    take: 30,
  });

  let updated = 0;

  for (const product of products) {
    const baseTitle = buildProductMetaTitle(product.name);
    const uniqueTail = ` • ${product.category.name}`;
    const metaTitle = truncateByWords(`${baseTitle}${uniqueTail}`, 70);
    const metaDesc = buildProductMetaDescription({
      name: product.name,
      categoryName: product.category.name,
      sourceDescription: product.description ?? "",
    });

    if (isDryRun) {
      console.log(
        [
          `#${product.id} ${product.slug}`,
          `TITLE: ${metaTitle}`,
          `DESC: ${metaDesc}`,
          "---",
        ].join("\n")
      );
    } else {
      await prisma.product.update({
        where: { id: product.id },
        data: { metaTitle, metaDesc },
      });
    }

    updated += 1;
  }

  if (isDryRun) {
    console.log(`Dry run complete. Previewed ${updated} products. No DB changes made.`);
  } else {
    console.log(`Updated SEO meta for ${updated} products`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
