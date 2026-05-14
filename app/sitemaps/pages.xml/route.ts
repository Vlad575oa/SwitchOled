import { NextResponse } from "next/server";
import { stat } from "fs/promises";
import path from "path";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru").replace("://www.", "://");

const pages: Array<{ urlPath: string; sourceFile: string }> = [
  { urlPath: "/", sourceFile: "app/(site)/page.tsx" },
  { urlPath: "/catalog/all", sourceFile: "app/(site)/catalog/[category]/page.tsx" },
  { urlPath: "/blog", sourceFile: "app/(site)/blog/page.tsx" },
  { urlPath: "/contacts", sourceFile: "app/(site)/contacts/page.tsx" },
  { urlPath: "/faq", sourceFile: "app/(site)/faq/page.tsx" },
  { urlPath: "/delivery", sourceFile: "app/(site)/delivery/page.tsx" },
  { urlPath: "/payment", sourceFile: "app/(site)/payment/page.tsx" },
  { urlPath: "/refund", sourceFile: "app/(site)/refund/page.tsx" },
  { urlPath: "/reviews", sourceFile: "app/(site)/reviews/page.tsx" },
  { urlPath: "/warranty", sourceFile: "app/(site)/warranty/page.tsx" },
  { urlPath: "/about", sourceFile: "app/(site)/about/page.tsx" },
  { urlPath: "/policy", sourceFile: "app/(site)/policy/page.tsx" },
];

export const dynamic = "force-dynamic";

const safeLastmod = async (sourceFile: string) => {
  try {
    const absolutePath = path.join(process.cwd(), sourceFile);
    const fileStat = await stat(absolutePath);
    return fileStat.mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

export async function GET() {
  const urlsWithLastmod = await Promise.all(
    pages.map(async (page) => ({
      ...page,
      lastmod: await safeLastmod(page.sourceFile),
    }))
  );

  const urls = urlsWithLastmod
    .map((page) => `<url><loc>${baseUrl}${page.urlPath}</loc><lastmod>${page.lastmod}</lastmod></url>`)
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
