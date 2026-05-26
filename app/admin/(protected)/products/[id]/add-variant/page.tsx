import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductForm } from "../../ProductForm";
import type { VariantRow } from "../../ProductForm";

export const dynamic = "force-dynamic";

const STRIP_KEYS = new Set(["Цвет", "Накопитель", "Объём", "Объем"]);
const MEMORY_KEYS = ["Накопитель", "Объём", "Объем"];

export default async function AddVariantPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const [source, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!source) notFound();

  const rawAttrs = (source.attributes as Record<string, string>) ?? {};

  // Existing variant pre-filled, plus one empty row for the new variant
  const memory = MEMORY_KEYS.map((k) => rawAttrs[k]).find(Boolean) ?? "";
  const color = rawAttrs["Цвет"] ?? source.color ?? "";
  const priceRub = source.price / 100;
  const priceOldRub = source.priceOld
    ? source.priceOld / 100
    : Math.round(priceRub * 1.13);

  const initialVariants: Omit<VariantRow, "_deleted">[] = [
    {
      id: source.id,
      name: source.name,
      slug: source.slug,
      sku: source.sku ?? "",
      color,
      colorHex: source.colorHex ?? "",
      memory,
      price: String(priceRub),
      priceOld: String(priceOldRub),
      showOtherPaymentPrice: source.showOtherPaymentPrice ?? false,
      stock: String(source.stock),
      inStock: source.inStock,
      images: source.images,
      newImages: [],
      newPreviews: [],
    },
    {
      name: `${source.name} (новый вариант)`,
      slug: "",
      sku: "",
      color: "",
      colorHex: "",
      memory: "",
      price: "",
      priceOld: "",
      showOtherPaymentPrice: false,
      stock: "10",
      inStock: true,
      images: [],
      newImages: [],
      newPreviews: [],
    },
  ];

  const sharedAttrs = Object.entries(rawAttrs)
    .filter(([k]) => !STRIP_KEYS.has(k))
    .map(([key, value]) => ({ key, value: String(value) }));

  return (
    <ProductForm
      categories={categories}
      sourceProductName={source.name}
      initialAttrs={sharedAttrs}
      initial={{
        description: source.description ?? "",
        categoryId: String(source.categoryId),
        isNew: source.isNew,
        isSale: source.isSale,
        metaTitle: "",
        metaDesc: "",
      }}
      initialVariants={initialVariants}
    />
  );
}
