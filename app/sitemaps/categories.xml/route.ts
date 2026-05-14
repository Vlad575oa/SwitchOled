import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru").replace("://www.", "://");

export const dynamic = "force-dynamic";

export async function GET() {
  let categories: Array<{ slug: string }> = [];

  try {
    categories = await prisma.category.findMany({
      where: {
        products: {
          some: { isVisible: { not: false } },
        },
      },
      select: { slug: true },
    });
  } catch (error) {
    console.error("SITEMAP categories.xml error:", error);
  }

  const urls = categories
    .map((c) => `<url><loc>${baseUrl}/catalog/${c.slug}</loc></url>`)
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
