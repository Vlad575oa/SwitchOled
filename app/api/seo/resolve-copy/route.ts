import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeCopySlug } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const path = url.searchParams.get("path") ?? "";
    const parts = path.split("/").filter(Boolean);
    if (parts.length < 3 || parts[0] !== "catalog") {
      return NextResponse.json({ targetUrl: null });
    }

    const categorySlug = parts[1];
    const rawProductSlug = parts[2];
    const normalizedSlug = normalizeCopySlug(rawProductSlug);

    if (!normalizedSlug || normalizedSlug === rawProductSlug) {
      return NextResponse.json({ targetUrl: null });
    }

    const product = await prisma.product.findFirst({
      where: {
        slug: normalizedSlug,
        isVisible: { not: false },
        category: { slug: categorySlug },
      },
      select: { slug: true, category: { select: { slug: true } } },
    });

    if (!product) {
      return NextResponse.json({ targetUrl: null });
    }

    return NextResponse.json({
      targetUrl: `https://gameshop24.ru/catalog/${product.category.slug}/${product.slug}`,
    });
  } catch {
    return NextResponse.json({ targetUrl: null });
  }
}

