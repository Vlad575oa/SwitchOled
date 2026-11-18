import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { Metadata } from "next";
import { InfoPageShell, InfoHero, Section } from "@/components/info/InfoKit";
import { getBlogImage } from "@/lib/blogImages";

export const revalidate = 1800;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}): Promise<Metadata> {
  const category = searchParams.category;
  return {
    title: "Блог игромана | Новости, обзоры и гайды",
    description: "Самые свежие новости из мира консолей, подробные обзоры PS5 Pro, Nintendo Switch 2 и ретро-гейминга.",
    alternates: { canonical: "https://switcholed.ru/blog" },
    ...(category ? { robots: { index: false, follow: true } } : {}),
  };
}

const calculateReadingTime = (content: string) => {
  const words = content.split(/\s+/).length;
  return Math.ceil(words / 200);
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const currentCategory = searchParams.category || "Все";

  let posts: Array<{
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    image: string | null;
    category: string | null;
    createdAt: Date;
  }> = [];
  let allPosts: Array<{ category: string | null }> = [];

  try {
    [posts, allPosts] = await Promise.all([
      prisma.post.findMany({
        where: {
          isPublished: true,
          ...(currentCategory !== "Все" ? { category: currentCategory } : {}),
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.post.findMany({
        where: { isPublished: true },
        select: { category: true },
      }),
    ]);
  } catch (error) {
    console.error("BLOG page query error:", error);
  }

  const counts = allPosts.reduce<Record<string, number>>((acc, p) => {
    if (p.category) acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  const categories = ["Все", "Обзоры", "Гайды", "Новости", "Слухи"];

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://switcholed.ru";
  const blogListSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Блог Switch OLED",
    "url": `${baseUrl}/blog`,
    "description": "Новости, обзоры и гайды из мира Nintendo, PlayStation и Xbox",
    "publisher": {
      "@type": "Organization",
      "name": "Switch OLED",
      "url": baseUrl,
    },
    "blogPost": posts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "url": `${baseUrl}/blog/${post.slug}`,
      "datePublished": post.createdAt.toISOString(),
      "image": getBlogImage(post),
    })),
  };

  return (
    <InfoPageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />
      <InfoHero
        eyebrow="Блог"
        title="Гайды, обзоры и новости о Switch"
        lead="Как выбрать консоль, какие игры поставить и что нового у Nintendo — простым языком."
      />

      <Section>
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => {
            const isActive = currentCategory === cat;
            const count = cat === "Все" ? allPosts.length : (counts[cat] ?? 0);
            return (
              <Link
                key={cat}
                href={cat === "Все" ? "/blog" : `/blog?category=${cat}`}
                scroll={false}
                className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-[14px] border transition-colors ${
                  isActive ? "bg-black border-black text-white" : "border-black/15 text-black hover:border-black"
                }`}
              >
                {cat}
                <span className={isActive ? "text-white/60" : "text-black/40"}>{count}</span>
              </Link>
            );
          })}
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl bg-surface-soft py-16 text-center">
            <p className="text-[19px] font-semibold text-black">Здесь пока нет статей</p>
            <p className="mt-2 text-[15px] text-black/55">Скоро напишем — а пока загляните в другие разделы.</p>
            <Link href="/blog" className="mt-5 inline-block text-[15px] font-medium text-black underline underline-offset-4">
              Все статьи
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-8">
            {posts.map((post) => {
              const readTime = calculateReadingTime(post.content);
              return (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col">
                  <div className="relative overflow-hidden rounded-2xl bg-surface-soft aspect-[16/10]">
                    <Image
                      src={getBlogImage(post)}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={72}
                      loading="lazy"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-3 top-3 rounded-md bg-white px-2.5 py-1 text-[12px] font-medium text-black">
                      {post.category || "Статья"}
                    </span>
                  </div>
                  <p className="mt-4 text-[13px] text-black/45">
                    {format(new Date(post.createdAt), "dd.MM.yyyy")} · {readTime} мин чтения
                  </p>
                  <h3 className="mt-1.5 text-[19px] font-semibold leading-[1.3] tracking-[-0.01em] text-black group-hover:text-black/70 transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-[15px] leading-[1.55] text-black/55 line-clamp-2">{post.excerpt}</p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1 text-[14px] font-medium text-black">
                    Читать <ArrowUpRight size={15} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Section>
    </InfoPageShell>
  );
}
