import prisma from "@/lib/prisma";
import { brandedTitle } from "@/lib/seo";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export const revalidate = 3600;
import { ru } from "date-fns/locale";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { marked } from "marked";
import { Prisma } from "@prisma/client";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import { PageViewTracker } from "@/components/PageViewTracker";
import { getBlogImage } from "@/lib/blogImages";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://switcholed.ru").replace("://www.", "://");

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  let post: Awaited<ReturnType<typeof prisma.post.findUnique>> = null;
  try {
    post = await prisma.post.findUnique({ where: { slug } });
  } catch (error) {
    console.error("BLOG metadata query error:", error);
  }
  if (!post) return {};

  const title = post.metaTitle || post.title;
  const description = post.metaDesc || post.excerpt || "";
  const image = getBlogImage(post);

  return {
    title: brandedTitle(title),
    description,
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`
    },
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    }
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;
  const slug = decodeURIComponent(params.slug);
  let post: Awaited<ReturnType<typeof prisma.post.findUnique>> = null;
  try {
    post = await prisma.post.findUnique({ where: { slug } });
  } catch (error) {
    console.error("BLOG post query error:", error);
  }

  if (!post) notFound();

  const postImage = getBlogImage(post);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt || "",
    "image": [postImage],
    "datePublished": post.createdAt.toISOString(),
    "dateModified": post.updatedAt.toISOString(),
    "author": {
      "@type": "Organization",
      "name": "Switch OLED",
      "url": baseUrl,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Switch OLED",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/favicon.svg`,
        "width": 512,
        "height": 512,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Главная", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Блог", "item": `${baseUrl}/blog` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": `${baseUrl}/blog/${post.slug}` },
    ],
  };

  let relatedPosts: Awaited<ReturnType<typeof prisma.post.findMany>> = [];
  let relatedProducts: ProductWithCategory[] = [];
  try {
    [relatedPosts, relatedProducts] = await Promise.all([
      prisma.post.findMany({
        where: {
          isPublished: true,
          NOT: { id: post.id },
        },
        take: 3,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        where: { isVisible: { not: false }, inStock: true },
        take: 4,
        orderBy: { updatedAt: "desc" },
        include: { category: true },
      }),
    ]);
  } catch (error) {
    console.error("BLOG related data query error:", error);
  }

  // Article HTML with anchor ids on h2 so the sidebar table of contents can link to them.
  const toc: Array<{ id: string; title: string }> = [];
  const html = sanitizeRichHtml(marked(post.content) as string).replace(
    /<h2>([\s\S]*?)<\/h2>/g,
    (_m, inner: string) => {
      const id = `section-${toc.length + 1}`;
      toc.push({ id, title: inner.replace(/<[^>]*>/g, "").trim() });
      return `<h2 id="${id}">${inner}</h2>`;
    }
  );
  const readTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));
  const published = format(new Date(post.createdAt), "d MMMM yyyy", { locale: ru });

  const meta = (
    <div className="space-y-6">
      <div>
        <p className="text-[15px] font-medium text-black">{post.category || "Статья"}</p>
        <p className="text-[15px] text-black/45">{published} · {readTime} мин</p>
      </div>
      <div className="flex items-center gap-3 lg:block">
        <span className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black flex items-center justify-center shrink-0">
          <span className="w-5 h-5 rounded-full border-[5px] border-white" />
        </span>
        <div className="lg:mt-3">
          <p className="text-[15px] font-medium text-black">Команда Switch OLED</p>
          <p className="text-[15px] text-black/45">Магазин прошитых Switch</p>
        </div>
      </div>
    </div>
  );

  return (
    <article className="bg-white min-h-screen">
      <PageViewTracker pageType="article" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 pt-6 lg:pt-10 pb-20 grid grid-cols-1 lg:grid-cols-[160px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)] gap-x-10 xl:gap-x-14">
        {/* Left rail */}
        <div className="hidden lg:block pt-3">
          <Link href="/blog" className="text-[13px] uppercase tracking-[0.12em] text-black/45 hover:text-black">Блог</Link>
        </div>

        {/* Main column */}
        <div className="min-w-0">
          <Link href="/blog" className="lg:hidden text-[13px] uppercase tracking-[0.12em] text-black/45">Блог</Link>
          <h1 className="mt-3 lg:mt-0 text-[32px] sm:text-[42px] lg:text-[52px] font-semibold leading-[1.08] tracking-[-0.03em] text-black">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-5 max-w-[760px] text-[18px] sm:text-[21px] leading-[1.5] text-black/50">{post.excerpt}</p>
          )}

          <div className="lg:hidden mt-8">{meta}</div>

          <div className="mt-8 lg:mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_300px] gap-x-10 xl:gap-x-14">
          <div className="min-w-0">
          <div className="relative aspect-[2/1] rounded-2xl overflow-hidden bg-neutral-900">
            <Image
              src={postImage}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 900px"
              quality={88}
              className="object-cover"
              alt={post.title}
            />
          </div>

          <div
            className="
              mt-10 max-w-[760px]
              prose prose-neutral max-w-none text-[17px] sm:text-[18px]
              prose-headings:text-black prose-headings:tracking-[-0.02em]
              prose-h2:text-[26px] sm:prose-h2:text-[32px] prose-h2:font-semibold prose-h2:mt-14 prose-h2:mb-5 prose-h2:scroll-mt-6
              prose-h3:text-[21px] prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-3
              prose-p:text-black/80 prose-p:leading-[1.75]
              prose-a:text-black prose-a:underline prose-a:underline-offset-4 prose-a:decoration-black/30 hover:prose-a:decoration-black
              prose-strong:text-black prose-strong:font-semibold
              prose-li:text-black/80
              prose-blockquote:not-italic prose-blockquote:border-l-2 prose-blockquote:border-black prose-blockquote:text-black prose-blockquote:font-normal
              prose-img:rounded-2xl
              prose-th:text-black prose-td:text-black/75
              prose-code:before:content-none prose-code:after:content-none
              [&_>_div_>_*:first-child]:mt-0
            "
          >
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-16 max-w-[760px]">
              <p className="text-[13px] uppercase tracking-[0.12em] text-black/45">Товары по теме</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/catalog/${product.category.slug}/${product.slug}`}
                    className="group rounded-2xl bg-surface-soft p-5 flex items-start justify-between gap-4 hover:bg-[#ececec] transition-colors"
                  >
                    <span>
                      <span className="block text-[16px] font-medium text-black line-clamp-2">{product.name}</span>
                      <span className="block mt-1 text-[14px] text-black/45">{product.category.name}</span>
                    </span>
                    <ArrowUpRight size={18} className="shrink-0 text-black/40 group-hover:text-black" />
                  </Link>
                ))}
              </div>
            </div>
          )}
          </div>

        {/* Right rail: meta + table of contents */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            {meta}
            {toc.length > 1 && (
              <nav className="mt-14" aria-label="Содержание">
                <p className="text-[13px] uppercase tracking-[0.12em] text-black/45">Содержание</p>
                <ul className="mt-4 space-y-3">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="block text-[15px] leading-[1.4] text-black/75 hover:text-black">
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </aside>
          </div>
        </div>

      </div>

      {relatedPosts.length > 0 && (
        <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 pb-20">
          <div className="h-16 lg:h-[72px] rounded-2xl bg-surface-soft flex items-center justify-center">
            <h2 className="text-[17px] lg:text-[19px] font-medium text-black">Читайте также</h2>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-8">
            {relatedPosts.map((rel) => (
              <Link key={rel.slug} href={`/blog/${rel.slug}`} className="group flex flex-col">
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-surface-soft">
                  <Image
                    src={getBlogImage(rel)}
                    alt={rel.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    quality={72}
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-4 text-[19px] font-semibold leading-[1.3] tracking-[-0.01em] text-black group-hover:text-black/70">{rel.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
