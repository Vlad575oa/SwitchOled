import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCategorySlugsVisibleInCatalog } from "@/lib/categoryVisibility";
import { getCatalogSmartFilterEntries } from "@/lib/catalogSmartFilters";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://switcholed.ru").replace("://www.", "://");

export const dynamic = "force-dynamic";

export async function GET() {
  let categories: Array<{
    id: number;
    slug: string;
    parentId: number | null;
    _count: { products: number };
    products: { updatedAt: Date }[];
  }> = [];

  try {
    categories = await prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        parentId: true,
        _count: { select: { products: { where: { isVisible: { not: false } } } } },
        products: {
          where: { isVisible: { not: false } },
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { updatedAt: true },
        },
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

  const categoryLastmod = new Map(
    categories.map((c) => [c.slug, c.products[0]?.updatedAt?.toISOString() ?? new Date().toISOString()])
  );

  const categoryUrls = visibleSlugs.map((slug) => {
    const lastmod = categoryLastmod.get(slug) ?? new Date().toISOString();
    return `<url><loc>${baseUrl}/catalog/${slug}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`;
  });

  const filterUrls = getCatalogSmartFilterEntries(visibleSlugs).map(
    ({ slug, filter }) =>
      `<url><loc>${baseUrl}/catalog/${slug}/${filter}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`
  );

  const urls = [...categoryUrls, ...filterUrls].join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
