import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCategorySlugsVisibleInCatalog } from "@/lib/categoryVisibility";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru").replace("://www.", "://");

export const dynamic = "force-dynamic";

export async function GET() {
  let categories: Array<{
    id: number;
    slug: string;
    parentId: number | null;
    _count: { products: number };
  }> = [];

  try {
    categories = await prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        parentId: true,
        _count: { select: { products: { where: { isVisible: { not: false } } } } },
      },
    });
  } catch (error) {
    console.error("SITEMAP categories.xml error:", error);
  }

  const visibleSlugs = getCategorySlugsVisibleInCatalog(
    categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      parentId: category.parentId,
      productCount: category._count.products,
    }))
  );

  const urls = visibleSlugs
    .map((slug) => `<url><loc>${baseUrl}/catalog/${slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`)
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
