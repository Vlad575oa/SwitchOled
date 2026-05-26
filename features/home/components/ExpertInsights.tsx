import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

const getRecentPosts = unstable_cache(
  async () => {
    const raw = await prisma.post.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 9,
      select: { id: true, title: true, slug: true, excerpt: true, image: true, category: true },
    });

    const isNintendo = (p: (typeof raw)[0]) =>
      p.category?.toLowerCase().includes("nintendo") ||
      p.title?.toLowerCase().includes("nintendo") ||
      p.title?.toLowerCase().includes("switch");

    return [
      ...raw.filter(isNintendo),
      ...raw.filter((p) => !isNintendo(p)),
    ].slice(0, 3);
  },
  ["recent-posts"],
  { revalidate: 3600, tags: ["posts"] }
);

export async function ExpertInsights() {
  const posts = await getRecentPosts();
  if (!posts.length) return null;

  return (
    <section className="mb-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Knowledge Base</h2>
          <h3 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">
            Экспертные статьи
          </h3>
        </div>
        <Link href="/blog" className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-primary transition-colors">
          Все материалы <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="aspect-video overflow-hidden relative">
              <Image
                src={post.image || "/images/placeholder.jpg"}
                alt={post.title}
                fill
                sizes="(max-width: 640px) calc(100vw - 48px), (max-width: 768px) calc(100vw - 48px), 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                quality={75}
              />
            </div>
            <div className="p-7">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                  {post.category || "Обзор"}
                </span>
                <span className="text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={10} /> 4 мин
                </span>
              </div>
              <h4 className="text-lg font-black text-[var(--text-primary)] leading-tight uppercase tracking-tight group-hover:text-primary transition-colors mb-4 line-clamp-2">
                {post.title}
              </h4>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed line-clamp-2">
                {post.excerpt}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
