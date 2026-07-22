import { getProductBySlug, getProductVariants, getCategoryBySlug, getCategoryDescendantSlugsBySlug, getProductsCount } from "@/lib/queries";
import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import { Catalog } from "@/features/catalog/components/Catalog";

export const dynamic = "force-dynamic";
import { ProductGallery } from "@/features/product/components/ProductGallery";
import { PurchaseBlock } from "@/features/product/components/PurchaseBlock";
import { ProductMeta } from "@/features/product/components/ProductMeta";
import { TrackView } from "@/features/product/components/TrackView";
import { ProductTabs } from "@/features/product/components/ProductTabs";
import { MobileStickyCart } from "@/features/product/components/MobileStickyCart";
import { RelatedProducts } from "@/features/product/components/RelatedProducts";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { buildProductMetaDescription, resolveProductMetaTitle } from "@/lib/seo";
import { CATALOG_SMART_FILTERS } from "@/lib/catalogSmartFilters";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru").replace("://www.", "://");

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: { product: string; category: string };
}): Promise<Metadata> {
  const smartFilter = CATALOG_SMART_FILTERS[params.product];
  if (smartFilter) {
    const category = await getCategoryBySlug(params.category);
    const title = `${smartFilter.title} ${category?.name || ""} — Купить в Gameshop24`;
    return {
      title,
      description: smartFilter.desc,
      alternates: { canonical: `${baseUrl}/catalog/${params.category}/${params.product}` },
    };
  }

  const product = await getProductBySlug(params.product);
  if (!product) return { title: "Товар не найден" };

  const title = resolveProductMetaTitle(product.metaTitle, product.name);
  const description =
    product.metaDesc?.trim() ||
    buildProductMetaDescription({
      name: product.name,
      categoryName: product.category?.name ?? null,
      sourceDescription: product.description ?? "",
    });

  const ogImage = product.images?.[0]
    ? [{ url: product.images[0], width: 1200, height: 630, alt: product.name }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/catalog/${product.category.slug}/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/catalog/${product.category.slug}/${product.slug}`,
      type: "website",
      ...(ogImage && { images: ogImage }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage && { images: [ogImage[0].url] }),
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { product: string; category: string };
  searchParams: Record<string, string | undefined>;
}) {
  const smartFilter = CATALOG_SMART_FILTERS[params.product];
  
  if (smartFilter) {
    const combinedParams = { ...searchParams };
    if (smartFilter.q) combinedParams.q = smartFilter.q;
    if (smartFilter.status) combinedParams.status = smartFilter.status;

    return (
      <main className="w-full max-w-[1920px] mx-auto px-6 py-12">
         <div className="mb-8">
            <nav className="flex items-center gap-2 text-[10px] font-bold text-neutral-300 uppercase tracking-widest mb-4">
              <Link href="/" className="hover:text-primary transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <Link href="/catalog/all" className="hover:text-primary transition-colors">Каталог</Link>
              <ChevronRight size={10} />
              <Link href={`/catalog/${params.category}`} className="hover:text-primary transition-colors">{params.category}</Link>
            </nav>
            <h1 className="text-4xl font-black text-secondary uppercase italic">{smartFilter.title}</h1>
            <p className="text-neutral-400 font-medium mt-2">{smartFilter.desc}</p>
         </div>
         <Catalog category={params.category} searchParams={combinedParams} />
      </main>
    );
  }

  const product = await getProductBySlug(params.product);
  if (!product) notFound();
  if (params.category !== product.category.slug) {
    permanentRedirect(`/catalog/${product.category.slug}/${product.slug}`);
  }
  const variants = await getProductVariants(product.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description?.replace(/<[^>]*>/g, "") || product.name,
    url: `${baseUrl}/catalog/${product.category.slug}/${product.slug}`,
    ...(product.sku ? { sku: product.sku } : {}),
    brand: { "@type": "Brand", name: product.brand || "Nintendo" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "47",
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/catalog/${product.category.slug}/${product.slug}`,
      price: (product.price / 100).toFixed(2),
      priceCurrency: "RUB",
      itemCondition: "https://schema.org/NewCondition",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Gameshop24", url: baseUrl },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Каталог", item: `${baseUrl}/catalog/all` },
      { "@type": "ListItem", position: 3, name: product.category.name, item: `${baseUrl}/catalog/${product.category.slug}` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${baseUrl}/catalog/${product.category.slug}/${product.slug}` },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Предоставляется ли гарантия на ${product.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Да, на все консоли в нашем магазине предоставляется полная гарантия сроком 1 год. В комплекте идет гарантийный талон."
        }
      },
      {
        "@type": "Question",
        "name": `Как осуществляется доставка ${product.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Мы осуществляем быструю доставку курьером по городу и СДЭКом по всей России. Возможен самовывоз из нашего офиса."
        }
      }
    ]
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <main className="container py-8 lg:py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-neutral-300 uppercase tracking-widest mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          <Link href="/" className="hover:text-primary transition-colors">
            Главная
          </Link>
          <ChevronRight size={10} className="text-neutral-200" />
          <Link href="/catalog/all" className="hover:text-primary transition-colors">
            Каталог
          </Link>
          <ChevronRight size={10} className="text-neutral-200" />
          <Link
            href={`/catalog/${product.category.slug}`}
            className="hover:text-primary transition-colors"
          >
            {product.category.name}
          </Link>
          <ChevronRight size={10} className="text-neutral-200" />
          <span className="text-neutral-400 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Track recently viewed */}
        <TrackView productId={product.id} />

        {/* Product name */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-black text-secondary leading-tight mb-3 max-w-4xl">
            {product.name}
          </h1>
          <ProductMeta productId={product.id} />
        </div>

        {/* Main grid: Gallery + Tabs | Purchase */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <ProductGallery images={product.images} name={product.name} />

            {/* Description & Specs tabs */}
            <ProductTabs
              description={product.description ? sanitizeRichHtml(product.description) : null}
              attributes={product.attributes as Record<string, string> | null}
              productName={product.name}
            />
          </div>

          {/* Right — Sticky purchase block */}
          <aside className="w-full lg:w-[380px] flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <PurchaseBlock product={product} variants={variants} categorySlug={product.category.slug} />
            </div>
          </aside>
        </div>
        <section className="mb-10 rounded-2xl border border-neutral-100 bg-white p-6">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Полезно перед покупкой</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/delivery", label: "Доставка" },
              { href: "/payment", label: "Оплата" },
              { href: "/refund", label: "Возврат" },
              { href: "/warranty", label: "Гарантия" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg bg-neutral-100 text-secondary text-xs font-black uppercase tracking-wide hover:bg-neutral-200 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/reviews"
              className="px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 transition-colors flex items-center gap-1"
            >
              ⭐ 5.0 Рейтинг
            </Link>
          </div>
        </section>

        {/* Related products */}
        <RelatedProducts categorySlug={product.category.slug} excludeId={product.id} limit={6} />

        {/* Sticky mobile add-to-cart */}
        <MobileStickyCart product={product} />
      </main>
    </div>
  );
}
