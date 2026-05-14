import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeCopySlug } from "@/lib/seo";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru").replace("://www.", "://");

export const dynamic = "force-dynamic";

export async function GET() {
  let products: Array<{ slug: string; updatedAt: Date; category: { slug: string } }> = [];

  try {
    products = await prisma.product.findMany({
      where: { isVisible: { not: false } },
      select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
    });
  } catch (error) {
    console.error("SITEMAP products.xml error:", error);
  }

  const urls = products
    .filter((p) => !p.slug.includes("copy"))
    .filter((p) => normalizeCopySlug(p.slug) === p.slug)
    .map(
      (p) =>
        `<url><loc>${baseUrl}/catalog/${p.category.slug}/${p.slug}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`
    )
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
