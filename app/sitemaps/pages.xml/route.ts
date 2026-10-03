import { NextResponse } from "next/server";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru").replace("://www.", "://");

const pages = [
  "/",
  "/catalog/all",
  "/contacts",
  "/faq",
  "/delivery",
  "/payment",
  "/refund",
  "/reviews",
  "/warranty",
  "/about",
  "/service",
  "/policy",
];

export const dynamic = "force-dynamic";

export async function GET() {
  const urls = pages
    .map((urlPath) => `<url><loc>${baseUrl}${urlPath}</loc></url>`)
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
