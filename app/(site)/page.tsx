import { Catalog } from "@/features/catalog/components/Catalog";
import { CatalogSkeleton } from "@/features/catalog/components/CatalogSkeleton";
import { ExpertInsights } from "@/features/home/components/ExpertInsights";
import loadDynamic from "next/dynamic";
import { Metadata } from "next";
import { Suspense } from "react";

// Removed force-dynamic — page uses Data Cache + unstable_cache in queries.
// searchParams make the route per-request by default; no need to force it.

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
    <main className="w-full max-w-[1920px] mx-auto px-6 lg:px-16 pt-6 pb-20">

      <div id="catalog" className="mb-20 scroll-mt-24">
        <Suspense fallback={<CatalogSkeleton count={8} />}>
          <Catalog
            category="all"
            searchParams={searchParams}
            pageSize={8}
            gridClassName="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4"
          />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <ExpertInsights />
      </Suspense>
      <RecentlyViewed />
    </main>
  );
}
