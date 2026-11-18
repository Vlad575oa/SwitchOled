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
import { brandedTitle, buildProductMetaDescription, resolveProductMetaTitle, stripHtml, truncateByWords } from "@/lib/seo";
import { getCatalogSmartFilter } from "@/lib/catalogSmartFilters";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import { PageViewTracker } from "@/components/PageViewTracker";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://switcholed.ru").replace("://www.", "://");

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: { product: string; category: string };
}): Promise<Metadata> {
  const smartFilter = getCatalogSmartFilter(params.category, params.product);
  if (smartFilter) {
    const category = await getCategoryBySlug(params.category);
    const categoryName = params.category === "all" ? "игровые консоли" : category?.name;
    const title = `${smartFilter.title} ${categoryName ?? "товары"} — купить`;
    return {
      title: brandedTitle(title),
      description: smartFilter.metaDesc(categoryName ?? "товары"),
      alternates: { canonical: `${baseUrl}/catalog/${params.category}/${params.product}` },
    };
  }

  const product = await getProductBySlug(params.product);
  if (!product) return { title: "Товар не найден" };

  const title = resolveProductMetaTitle(product.metaTitle, product.name, product.color);
  const description =
    product.metaDesc?.trim() ||
    buildProductMetaDescription({
      name: product.name,
      categoryName: product.category?.name ?? null,
      variantLabel: product.color,
      sourceDescription: product.description ?? "",
    });

  const ogImage = product.images?.[0]
    ? [{ url: product.images[0], width: 1200, height: 630, alt: product.name }]
    : undefined;

  return {
    title: brandedTitle(title),
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
  const smartFilter = getCatalogSmartFilter(params.category, params.product);
  
  if (smartFilter) {
    const smartFilterCategory = await getCategoryBySlug(params.category);
    const smartFilterCategoryName = params.category === "all" ? "" : smartFilterCategory?.name ?? "";
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
            <h1 className="text-4xl font-black text-secondary uppercase italic">
              {smartFilter.title} {smartFilterCategoryName}
            </h1>
            <p className="text-neutral-400 font-medium mt-2">{smartFilter.desc}</p>
         </div>
         <Catalog category={params.category} searchParams={combinedParams} headingLevel="h2" />
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
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/catalog/${product.category.slug}/${product.slug}`,
      price: (product.price / 100).toFixed(2),
      priceCurrency: "RUB",
      itemCondition: "https://schema.org/NewCondition",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Switch OLED", url: baseUrl },
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

  const plainDescription = stripHtml(product.description);
  const excerpt = plainDescription
    ? `${truncateByWords(plainDescription, 220)}${plainDescription.length > 220 ? "…" : ""}`
    : undefined;

  return (
    <div className="bg-white min-h-screen">
      <main className="w-full max-w-[1600px] mx-auto px-3 lg:px-6 pt-6 lg:pt-8 pb-12">
        <PageViewTracker productId={product.id} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />

        {/* Track recently viewed */}
        <TrackView productId={product.id} />

        {/* Main grid: Gallery | Purchase */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] gap-8 lg:gap-14 xl:gap-20">
          <div className="min-w-0">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          <aside className="product-mobile-gutter min-w-0">
            <div className="lg:sticky lg:top-6">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-[13px] text-black/45 overflow-x-auto no-scrollbar whitespace-nowrap">
                <Link href="/catalog/all" className="hover:text-black transition-colors">Каталог</Link>
                <span aria-hidden>•</span>
                <Link href={`/catalog/${product.category.slug}`} className="hover:text-black transition-colors">
                  {product.category.name}
                </Link>
              </nav>

              <h1 className="mt-3 text-[30px] sm:text-[36px] lg:text-[42px] font-semibold leading-[1.1] tracking-[-0.025em] text-black">
                {product.name}
              </h1>

              <div className="mt-3">
                <PurchaseBlock
                  product={product}
                  variants={variants}
                  categorySlug={product.category.slug}
                  excerpt={excerpt}
                />
              </div>

              <div className="mt-6">
                <ProductMeta productId={product.id} fallbackHref={`/catalog/${product.category.slug}`} />
              </div>
            </div>
          </aside>
        </div>

        {/* Full description & specs */}
        <div id="description" className="scroll-mt-6 max-w-[1100px]">
          <ProductTabs
            description={product.description ? sanitizeRichHtml(product.description) : null}
            attributes={product.attributes as Record<string, string> | null}
            productName={product.name}
          />
        </div>

        {/* Related products */}
        <div className="mt-16">
          <RelatedProducts categorySlug={product.category.slug} excludeId={product.id} limit={6} />
        </div>

        {/* Sticky mobile add-to-cart */}
        <MobileStickyCart product={product} />
      </main>
    </div>
  );
}
