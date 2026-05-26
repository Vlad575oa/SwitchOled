import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadImagesToS3 } from "@/lib/s3";
import { buildProductMetaDescription, buildProductMetaTitle } from "@/lib/seo";

function normalizeSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function resolveBrandFromCategory(categoryId: number) {
  let current: { id: number; name: string; parentId: number | null } | null = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, parentId: true },
  });

  if (!current) return null;

  while (current) {
    if (current.parentId == null) break;
    const parentId: number = current.parentId;
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: { id: true, name: true, parentId: true },
    });
    if (!parent) break;
    current = parent;
  }

  return current?.name ?? null;
}

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const fd = await request.formData();

    const name = ((fd.get("name") as string) || "").trim();
    const description = fd.get("description") as string;
    const sku = ((fd.get("sku") as string) || "").trim() || null;
    const price = Math.round(parseFloat(fd.get("price") as string) * 100);
    const priceOldRaw = fd.get("priceOld") as string;
    const priceOld = priceOldRaw ? Math.round(parseFloat(priceOldRaw) * 100) : null;
    const showOtherPaymentPrice = fd.get("showOtherPaymentPrice") === "true";
    const categoryId = parseInt(fd.get("categoryId") as string);
    const color = (fd.get("color") as string) || null;
    const colorHex = (fd.get("colorHex") as string) || null;
    const inStock = fd.get("inStock") === "true";
    const isNew = fd.get("isNew") === "true";
    const isSale = fd.get("isSale") === "true";
    const stock = parseInt(fd.get("stock") as string) || 10;
    const inputMetaTitle = ((fd.get("metaTitle") as string) || "").trim();
    const inputMetaDesc = ((fd.get("metaDesc") as string) || "").trim();
    const attrsRaw = fd.get("attributes") as string;
    const attributesList: { key: string; value: string }[] = attrsRaw ? JSON.parse(attrsRaw) : [];
    const attributes = Object.fromEntries(attributesList.map((a) => [a.key, a.value]));

    const files = fd.getAll("images") as File[];
    const imageUrls = files.length ? await uploadImagesToS3(files, "products") : [];

    const childCount = await prisma.category.count({ where: { parentId: categoryId } });
    if (childCount > 0) {
      return NextResponse.json(
        { error: "Для выбранной категории нужно указать подкатегорию" },
        { status: 400 }
      );
    }
    const brand = await resolveBrandFromCategory(categoryId);
    if (!brand) {
      return NextResponse.json(
        { error: "Не удалось определить бренд по выбранной категории" },
        { status: 400 }
      );
    }
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });

    const slugRaw = (fd.get("slug") as string) || "";
    if (!name) {
      return NextResponse.json({ error: "Название варианта обязательно" }, { status: 400 });
    }
    if (!slugRaw.trim()) {
      return NextResponse.json({ error: "Slug обязателен" }, { status: 400 });
    }
    const slug = normalizeSlug(slugRaw);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `Slug «${slug}» уже занят товаром «${existing.name}»` },
        { status: 400 }
      );
    }

    const metaTitle = inputMetaTitle || buildProductMetaTitle(name);
    const metaDesc =
      inputMetaDesc ||
      buildProductMetaDescription({
        name,
        categoryName: category?.name ?? null,
        sourceDescription: description ?? "",
      });

    const product = await prisma.product.create({
      data: {
        name, slug, sku, description, price, priceOld, showOtherPaymentPrice,
        categoryId, brand, color, colorHex, inStock, isNew, isSale,
        stock, images: imageUrls, attributes, metaTitle, metaDesc,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
