import prisma from "@/lib/prisma";
import { normalizeS3ObjectUrl } from "@/lib/imageUrls";
import { ProductCard } from "./ProductCard";

interface RelatedProductsProps {
  categorySlug: string;
  excludeId: number;
  limit?: number;
}

export async function RelatedProducts({ categorySlug, excludeId, limit = 6 }: RelatedProductsProps) {
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: { isVisible: { not: false }, category: { slug: categorySlug }, NOT: { id: excludeId } },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
  } catch {
    return null;
  }

  products = products.map((product) => ({
    ...product,
    images: product.images.map((image: string) =>
      normalizeS3ObjectUrl(image, process.env.S3_BUCKET ?? "")
    ),
  }));

  if (!products.length) return null;

  return (
    <section className="mb-16">
      <div className="mb-8">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Из той же категории</p>
        <h2 className="text-2xl font-black text-secondary uppercase tracking-tight">Похожие товары</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
