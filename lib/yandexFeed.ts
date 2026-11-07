import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru").replace("://www.", "://");

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

export async function buildYmlFeedResponse(where: Prisma.ProductWhereInput = {}) {
  const products = await prisma.product.findMany({
    where: { isVisible: { not: false }, ...where },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      priceOld: true,
      inStock: true,
      brand: true,
      images: true,
      categoryId: true,
      category: { select: { slug: true } },
    },
    orderBy: { id: "asc" },
  });

  const categoryIds = Array.from(new Set(products.map((p) => p.categoryId)));
  const categories = await prisma.category.findMany({
    where: Object.keys(where).length ? { id: { in: categoryIds } } : {},
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });

  const now = new Date();
  const ymlDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const categoriesXml = categories
    .map((c) => `<category id="${c.id}">${xmlEscape(c.name)}</category>`)
    .join("");

  const offersXml = products
    .map((p) => {
      const productUrl = `${baseUrl}/catalog/${p.category.slug}/${p.slug}`;
      const title = xmlEscape(p.name);
      const description = xmlEscape(
        stripHtml(p.description || p.name).slice(0, 3000)
      );
      const pictures = (p.images || [])
        .slice(0, 10)
        .map((img) => {
          const imgUrl = img.startsWith("http")
            ? img
            : `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`;
          return `<picture>${xmlEscape(imgUrl)}</picture>`;
        })
        .join("");
      const oldPriceTag =
        p.priceOld && p.priceOld > p.price
          ? `<oldprice>${formatPrice(p.priceOld)}</oldprice>`
          : "";
      const vendorTag = p.brand ? `<vendor>${xmlEscape(p.brand)}</vendor>` : "";

      return `<offer id="${p.id}" available="${p.inStock ? "true" : "false"}">
<url>${xmlEscape(productUrl)}</url>
<price>${formatPrice(p.price)}</price>
${oldPriceTag}
<currencyId>RUB</currencyId>
<categoryId>${p.categoryId}</categoryId>
${pictures}
${vendorTag}
<name>${title}</name>
<description>${description}</description>
</offer>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${ymlDate}">
  <shop>
    <name>Gameshop24</name>
    <company>Gameshop24</company>
    <url>${xmlEscape(baseUrl)}</url>
    <currencies>
      <currency id="RUB" rate="1"/>
    </currencies>
    <categories>${categoriesXml}</categories>
    <offers>${offersXml}</offers>
  </shop>
</yml_catalog>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
