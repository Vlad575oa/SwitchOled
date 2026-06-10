import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";
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

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await prisma.product.findUnique({
    where: { id: parseInt(params.id) },
    include: { category: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const authSession = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = parseInt(params.id);
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
    const slugRaw = (fd.get("slug") as string) || "";
    const attrsRaw = fd.get("attributes") as string;
    const attributesList: { key: string; value: string }[] = attrsRaw ? JSON.parse(attrsRaw) : [];
    const attributes = Object.fromEntries(attributesList.map((a) => [a.key, a.value]));

    const existingImagesRaw = fd.get("existingImages") as string;
    const existingImages: string[] = existingImagesRaw ? JSON.parse(existingImagesRaw) : [];

    const newFiles = fd.getAll("images") as File[];
    const newUrls = newFiles.length ? await uploadImagesToS3(newFiles, "products") : [];
    const images = [...existingImages, ...newUrls];

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

    const slug = normalizeSlug(slugRaw);
    if (!name) {
      return NextResponse.json({ error: "Название варианта обязательно" }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json({ error: "Slug обязателен" }, { status: 400 });
    }

    const conflict = await prisma.product.findFirst({
      where: { slug, NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json(
        { error: `Slug «${slug}» уже занят товаром ID ${conflict.id}` },
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

    const product = await prisma.product.update({
      where: { id },
      data: {
        name, description, sku, price, priceOld, showOtherPaymentPrice, categoryId,
        brand, color, colorHex, inStock, isNew, isSale, stock,
        images, attributes, metaTitle, metaDesc,
        slug,
      },
      include: { category: true },
    });

    const productUrl = `${process.env.NEXT_PUBLIC_APP_URL}/catalog/${product.category.slug}/${product.slug}`;
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/indexnow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: [productUrl] }),
    }).catch(() => {});

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const data: { isVisible?: boolean; inStock?: boolean } = {};

    if (typeof body?.isVisible === "boolean") data.isVisible = body.isVisible;
    if (typeof body?.inStock === "boolean") data.inStock = body.inStock;

    if (!("isVisible" in data) && !("inStock" in data)) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const product = await prisma.product.update({ where: { id }, data });
    return NextResponse.json({ success: true, isVisible: product.isVisible, inStock: product.inStock });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.r === "MANAGER") {
      return NextResponse.json(
        { error: "У менеджера нет прав на удаление товаров" },
        { status: 403 }
      );
    }

    await prisma.product.delete({ where: { id: parseInt(params.id) } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
