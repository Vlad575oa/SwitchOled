import { Catalog } from "@/features/catalog/components/Catalog";
import { ExpertInsights } from "@/features/home/components/ExpertInsights";
import loadDynamic from "next/dynamic";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const RecentlyViewed = loadDynamic(
  () => import("@/features/product/components/RecentlyViewed").then((m) => m.RecentlyViewed),
  { ssr: false }
);


export const metadata: Metadata = {
  title: "Gameshop24 | Премиальный магазин консолей и игр",
  description: "Официальные консоли, редкие аксессуары и экспертные обзоры. Gameshop24 — твой проводник в мир премиального гейминга 2026.",
  alternates: {
    canonical: "/",
  },
};

interface HomePageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  return (
    <main className="container pt-6 pb-20">

      <div id="catalog" className="mb-20 scroll-mt-24">
        <Catalog
          category="all"
          searchParams={searchParams}
          pageSize={8}
          gridClassName="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4"
        />
      </div>

      <ExpertInsights />
      <RecentlyViewed />
    </main>
  );
}
