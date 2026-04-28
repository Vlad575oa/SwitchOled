import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export async function GET() {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? "",
    description: p.description ?? "",
    price: p.price,
    priceOld: p.priceOld ?? "",
    showOtherPaymentPrice: p.showOtherPaymentPrice,
    images: p.images.join(" | "),
    inStock: p.inStock,
    isNew: p.isNew,
    isSale: p.isSale,
    color: p.color ?? "",
    brand: p.brand ?? "",
    attributes: p.attributes ? JSON.stringify(p.attributes) : "",
    categoryId: p.categoryId,
    categoryName: p.category.name,
    categorySlug: p.category.slug,
    metaTitle: p.metaTitle ?? "",
    metaDesc: p.metaDesc ?? "",
    stock: p.stock,
    isVisible: p.isVisible,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  const now = new Date();
  const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const filename = `products-export-${datePart}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

