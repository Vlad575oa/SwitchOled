import { Catalog } from "@/features/catalog/components/Catalog";
import { CatalogSkeleton } from "@/features/catalog/components/CatalogSkeleton";
import { ExpertInsights } from "@/features/home/components/ExpertInsights";
import loadDynamic from "next/dynamic";
import { Metadata } from "next";
import { Suspense } from "react";

// force-dynamic required: page reads DB on every request via Catalog + ExpertInsights.
// Individual queries are cached at the Data Cache layer via unstable_cache (revalidate).
export const dynamic = "force-dynamic";

const RecentlyViewed = loadDynamic(
  () => import("@/features/product/components/RecentlyViewed").then((m) => m.RecentlyViewed),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Прошитые Nintendo Switch — купить в Москве | Gameshop24",
  description: "Прошитые Nintendo Switch OLED и Lite с гарантией 1 год. 45+ конфигураций от 27 000 ₽. 100+ игр в комплекте. Доставка в день заказа по Москве.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Прошитые Nintendo Switch — купить в Москве | Gameshop24",
    description: "Прошитые Nintendo Switch OLED и Lite с гарантией 1 год. 45+ конфигураций от 27 000 ₽. 100+ игр в комплекте.",
    url: "/",
    type: "website",
  },
};

interface HomePageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  return (
    <main className="w-full max-w-[1920px] mx-auto px-6 lg:px-6 2xl:px-4 pt-6 pb-20">

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
