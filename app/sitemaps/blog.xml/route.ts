import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://switcholed.ru").replace("://www.", "://");

export const dynamic = "force-dynamic";

export async function GET() {
  let posts: Array<{ slug: string; updatedAt: Date }> = [];

  try {
    posts = await prisma.post.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });
  } catch (error) {
    console.error("SITEMAP blog.xml error:", error);
  }

  const blogLastmod =
    posts.length > 0
      ? posts.reduce((latest, post) => (post.updatedAt > latest ? post.updatedAt : latest), posts[0].updatedAt).toISOString()
      : new Date().toISOString();

  const urls = posts
    .map((post) => `<url><loc>${baseUrl}/blog/${post.slug}</loc><lastmod>${post.updatedAt.toISOString()}</lastmod></url>`)
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${baseUrl}/blog</loc><lastmod>${blogLastmod}</lastmod></url>${urls}</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
