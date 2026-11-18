import { Catalog } from "@/features/catalog/components/Catalog";
import { CatalogSkeleton } from "@/features/catalog/components/CatalogSkeleton";
import { ExpertInsights } from "@/features/home/components/ExpertInsights";
import loadDynamic from "next/dynamic";
import { Metadata } from "next";
import { Suspense } from "react";
import { PageViewTracker } from "@/components/PageViewTracker";
import { HeroSlider } from "@/features/home/components/HeroSlider";
import { FeatureBar, Favorites } from "@/features/home/components/HomeSections";

// force-dynamic required: page reads DB on every request via Catalog + ExpertInsights.
// Individual queries are cached at the Data Cache layer via unstable_cache (revalidate).
export const dynamic = "force-dynamic";

const RecentlyViewed = loadDynamic(
  () => import("@/features/product/components/RecentlyViewed").then((m) => m.RecentlyViewed),
  { ssr: false }
);

export const metadata: Metadata = {
  title: { absolute: "Прошитые Nintendo Switch — купить в Москве | Switch OLED" },
  description: "Прошитые Nintendo Switch OLED и Lite с гарантией 1 год. 45+ конфигураций от 27 000 ₽. 100+ игр в комплекте. Доставка в день заказа по Москве.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Прошитые Nintendo Switch — купить в Москве | Switch OLED",
    description: "Прошитые Nintendo Switch OLED и Lite с гарантией 1 год. 45+ конфигураций от 27 000 ₽. 100+ игр в комплекте.",
    url: "/",
    type: "website",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Прошитые Nintendo Switch — Switch OLED" }],
  },
};

interface HomePageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  return (
    <main className="w-full">
      <PageViewTracker />
      <h1 className="sr-only">Прошитые Nintendo Switch — купить в Москве с гарантией</h1>
      <HeroSlider />
      <FeatureBar />
      <Suspense fallback={null}>
        <Favorites />
      </Suspense>

      <div id="catalog" className="w-full max-w-[1920px] mx-auto px-6 lg:px-6 2xl:px-4 pt-10 lg:pt-14 pb-16 lg:pb-24 scroll-mt-24">
        <Suspense fallback={<CatalogSkeleton count={8} />}>
          <Catalog
            category="all"
            searchParams={searchParams}
            pageSize={8}
            headingLevel="h2"
            gridClassName="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-[3px] sm:gap-4"
          />
        </Suspense>
      </div>

      <div className="w-full max-w-[1920px] mx-auto px-3 lg:px-6 2xl:px-4 pb-20">
        <Suspense fallback={null}>
          <ExpertInsights />
        </Suspense>
        <RecentlyViewed />
      </div>
    </main>
  );
}
