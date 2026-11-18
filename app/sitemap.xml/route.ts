import { NextResponse } from "next/server";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://switcholed.ru").replace("://www.", "://");

export const dynamic = "force-dynamic";

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${baseUrl}/sitemaps/pages.xml</loc></sitemap>
  <sitemap><loc>${baseUrl}/sitemaps/categories.xml</loc></sitemap>
  <sitemap><loc>${baseUrl}/sitemaps/products.xml</loc></sitemap>
  <sitemap><loc>${baseUrl}/sitemaps/blog.xml</loc></sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
