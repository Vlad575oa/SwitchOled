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
      <div className="mb-6 h-16 lg:h-[72px] rounded-2xl bg-surface-soft flex items-center justify-center">
        <h2 className="text-[17px] lg:text-[19px] font-medium text-black">Похожие товары</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
