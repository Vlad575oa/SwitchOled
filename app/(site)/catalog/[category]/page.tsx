import { getCategoryBySlug, getCategoryDescendantSlugsBySlug, getProductsCount } from "@/lib/queries";
import { Catalog } from "@/features/catalog/components/Catalog";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru";

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const category = await getCategoryBySlug(params.category);
  const categorySlugs =
    params.category !== "all" ? await getCategoryDescendantSlugsBySlug(params.category) : [];
  const visibleProductsCount =
    params.category === "all"
      ? await getProductsCount({})
      : await getProductsCount({
          category: {
            slug: categorySlugs.length ? { in: categorySlugs } : params.category,
          },
        });
  const title = category
    ? `${category.name} — Купить недорого в Gameshop24`
    : "Каталог игровых консолей | Gameshop24";
  
  const description = `Большой выбор товаров в категории ${category?.name ?? "Каталог"}. Лучшие цены, официальная гарантия и быстрая доставка по всей России.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/catalog/${params.category}`,
    },
    robots: {
      index: visibleProductsCount > 0,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/catalog/${params.category}`,
      images: [{ url: `${baseUrl}/og-catalog.jpg`, width: 1200, height: 630, alt: title }],
      type: "website",
    },
  };
}

interface CatalogPageProps {
  params: { category: string };
  searchParams: Record<string, string | undefined>;
}

export default async function CategoryPage({ params, searchParams }: CatalogPageProps) {
  const { category } = params;

  let categoryData: { name: string; slug: string } | null = null;
  if (category !== "all") {
    categoryData = await getCategoryBySlug(category);
    if (!categoryData) notFound();
  }

  const categorySlugs =
    category !== "all" ? await getCategoryDescendantSlugsBySlug(category) : [];

  const topProducts = await prisma.product.findMany({
    where: {
      isVisible: { not: false },
      ...(categorySlugs.length
        ? { category: { slug: { in: categorySlugs } } }
        : category !== "all"
        ? { category: { slug: category } }
        : {}),
    },
    orderBy: [{ inStock: "desc" }, { createdAt: "desc" }],
    take: 8,
    select: { name: true, slug: true, category: { select: { slug: true } } },
  }).catch(() => []);

  const itemListSchema = topProducts.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: categoryData ? categoryData.name : "Весь каталог",
    url: `${baseUrl}/catalog/${category}`,
    itemListElement: topProducts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/catalog/${p.category.slug}/${p.slug}`,
      name: p.name,
    })),
  } : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Каталог", item: `${baseUrl}/catalog/all` },
      ...(categoryData
        ? [{ "@type": "ListItem", position: 3, name: categoryData.name, item: `${baseUrl}/catalog/${category}` }]
        : []),
    ],
  };

  return (
    <main className="w-full max-w-[1920px] mx-auto px-6 lg:px-6 2xl:px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <Catalog category={category} searchParams={searchParams} />
    </main>
  );
}
