import prisma from "@/lib/prisma";
import { brandedTitle } from "@/lib/seo";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export const revalidate = 3600;
import { ru } from "date-fns/locale";
import { ArrowLeft, Clock, User, Share2, Bookmark, MessageCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { marked } from "marked";
import { Prisma } from "@prisma/client";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import { PageViewTracker } from "@/components/PageViewTracker";
import { getBlogImage } from "@/lib/blogImages";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru").replace("://www.", "://");

const heroActions = [
  { label: "Купить", href: "/" },
  { label: "Заказать", href: "/contacts" },
  { label: "Прошить", href: "/service" },
  { label: "Доставка", href: "/delivery" },
];
const rightHeroActions = [
  { label: "Доставка", href: "/delivery" },
  { label: "Прошивка", href: "/service" },
  { label: "Switch OLED", href: "/catalog/nintendo-switch-oled" },
  { label: "Switch Lite", href: "/catalog/nintendo-switch-lite" },
];

function BlogHeroSide({ image, side }: { image: string; side: "left" | "right" }) {
  return (
    <div className={`blog-hero-side ${side === "right" ? "blog-hero-side-right" : ""}`}>
      <Image
        src={image}
        alt=""
        fill
        sizes="180px"
        aria-hidden="true"
        className="blog-hero-side-bg"
      />
      <div className="blog-hero-side-content">
        {side === "left" ? (
          <div className="blog-hero-actions" aria-label="Навигация по магазину">
            {heroActions.map(({ label, href }) => (
              <Link key={label} href={href} className="blog-hero-action">
                <span className="blog-hero-action-led" />
                {label}
              </Link>
            ))}
          </div>
        ) : (
          <div className="blog-hero-actions" aria-label="Разделы магазина">
            {rightHeroActions.map(({ label, href }) => (
              <Link key={label} href={href} className="blog-hero-action">
                <span className="blog-hero-action-led" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
      "name": "Gameshop24",
      "url": baseUrl,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Gameshop24",
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

  return (
    <article className="bg-[#fcfcfd] min-h-screen pt-6 pb-20">
      <PageViewTracker pageType="article" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="container">
        {/* Header Container - expanded width */}
        <div className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0">
          {/* Minimal Breadcrumbs */}
          <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-neutral-400">
             <Link href="/" className="hover:text-primary transition-colors">Главная</Link>
             <ChevronRight size={10} />
             <Link href="/blog" className="hover:text-primary transition-colors">Блог</Link>
             <ChevronRight size={10} />
             <span className="text-neutral-500 truncate max-w-[200px]">{post.category || "Материал"}</span>
          </div>

          {/* Premium Refined Header */}
          <header className="space-y-4 mb-0">
            <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-primary text-white rounded-md text-[9px] font-black uppercase tracking-widest">
                 {post.category || "Материал"}
               </span>
               <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
                  <Clock size={12} className="text-primary" />
                  ~6 мин чтения
               </div>
            </div>
            <h1 className="text-2xl md:text-5xl font-black text-secondary tracking-tight leading-[1.1] uppercase italic">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-8 py-6 border-y border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center overflow-hidden">
                   <Image src="/icon-192.png" alt="GameShop24" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-secondary text-xs font-black uppercase tracking-widest">GameShop24 Team</span>
                  <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-[0.2em]">{format(new Date(post.createdAt), 'dd MMMM yyyy', { locale: ru })}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                 <button className="p-2.5 rounded-xl border border-neutral-100 bg-white hover:bg-neutral-50 transition-colors text-neutral-400">
                    <Share2 size={16} />
                 </button>
                 <button className="p-2.5 rounded-xl border border-neutral-100 bg-white hover:bg-neutral-50 transition-colors text-neutral-400">
                    <Bookmark size={16} />
                 </button>
              </div>
            </div>
          </header>
        </div>

        {/* Cinematic Main Image - even wider */}
        <div className="max-w-6xl mx-auto mb-12 px-0 md:px-4">
          <div className="blog-hero relative aspect-video md:aspect-[21/9] md:rounded-[40px] overflow-hidden bg-neutral-900 shadow-2xl group transition-transform duration-700 hover:scale-[1.01]">
            <Image
              src={postImage}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
              quality={88}
              className="blog-hero-backdrop"
              alt=""
              aria-hidden="true"
            />
            <div className="blog-hero-layout">
              <BlogHeroSide image={postImage} side="left" />
              <div className="blog-hero-main">
                <Image
                  src={postImage}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 900px"
                  quality={88}
                  className="w-full h-full object-cover"
                  alt={post.title}
                />
              </div>
              <BlogHeroSide image={postImage} side="right" />
            </div>
          </div>
        </div>

        {/* Content Container - expanded width and larger text */}
        <div className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0">
          {/* Content with Custom Prose */}
          <div className="
            article-prose
            prose prose-neutral max-w-none text-base md:text-lg lg:text-xl leading-relaxed

            prose-h2:text-2xl md:prose-h2:text-3xl lg:prose-h2:text-4xl prose-h2:font-black prose-h2:text-secondary
            prose-h2:tracking-tight prose-h2:mt-12 prose-h2:mb-6
            prose-h2:pb-4 prose-h2:border-b prose-h2:border-neutral-100

            prose-h3:text-xl md:prose-h3:text-2xl lg:prose-h3:text-3xl prose-h3:font-black prose-h3:text-secondary
            prose-h3:mt-10 prose-h3:mb-4

            prose-p:text-neutral-600 prose-p:leading-[1.8] prose-p:mb-6

            prose-a:text-primary prose-a:font-bold prose-a:no-underline
            hover:prose-a:underline

            prose-strong:text-secondary prose-strong:font-black

            prose-ul:my-6 prose-ul:space-y-2
            prose-ol:my-6 prose-ol:space-y-2
            prose-li:text-neutral-600 prose-li:leading-relaxed

            prose-table:w-full prose-table:text-sm md:prose-table:text-base
            prose-thead:bg-neutral-50
            prose-th:font-black prose-th:text-secondary prose-th:py-4 prose-th:px-6 prose-th:text-left
            prose-td:py-4 prose-td:px-6 prose-td:border-b prose-td:border-neutral-100 prose-td:text-neutral-600

            prose-blockquote:not-italic prose-blockquote:border-l-4
            prose-blockquote:border-primary prose-blockquote:bg-primary/5
            prose-blockquote:px-8 prose-blockquote:py-6 prose-blockquote:rounded-r-2xl
            prose-blockquote:text-secondary prose-blockquote:font-semibold lg:prose-blockquote:text-2xl

            prose-hr:border-neutral-100 prose-hr:my-12

            prose-img:rounded-[32px] prose-img:shadow-2xl prose-img:my-10

            prose-code:text-primary prose-code:bg-neutral-100
            prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
            prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            
            [&_>_div_>_*:first-child]:mt-0
          ">
            <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(marked(post.content) as string) }} />
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-20 space-y-8">
              <h4 className="text-xl font-black text-secondary uppercase tracking-tight">Рекомендуемые товары по теме</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {relatedProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/catalog/${product.category.slug}/${product.slug}`}
                    className="border border-neutral-100 rounded-2xl p-6 hover:border-neutral-300 hover:shadow-lg transition-all"
                  >
                    <p className="text-base font-black text-secondary line-clamp-2">{product.name}</p>
                    <p className="text-xs text-neutral-400 mt-2 font-bold uppercase tracking-widest">{product.category.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Material */}
          {relatedPosts.length > 0 && (
            <div className="mt-32 space-y-12">
               <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-black text-secondary uppercase tracking-tight italic">Вам может понравиться</h4>
                  <Link href="/blog" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Все статьи</Link>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {relatedPosts.map(rel => (
                   <Link key={rel.slug} href={`/blog/${rel.slug}`} className="group flex flex-col">
                      <div className="relative aspect-video rounded-3xl overflow-hidden shadow-sm border border-neutral-100 mb-6">
                        <Image
                          src={getBlogImage(rel)}
                          alt={rel.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                          quality={72}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                      <h5 className="text-lg font-black text-secondary group-hover:text-primary transition-colors leading-tight line-clamp-2">{rel.title}</h5>
                   </Link>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
