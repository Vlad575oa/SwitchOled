import prisma from "@/lib/prisma";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, colors] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
  ]);
  return <ProductForm categories={categories} colors={colors.map((c) => ({ name: c.name, hex: c.hex }))} />;
}
