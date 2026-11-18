import { Footer } from "@/components/Footer";
import { HeaderSkeleton } from "@/components/HeaderSkeleton";
import { Suspense } from "react";
import { CONTACTS } from "@/lib/constants/contacts";
import { getPageContent } from "@/lib/getPageContent";
import { getCategorySlugsWithProducts } from "@/lib/queries";
import { unstable_cache } from "next/cache";
import { getActiveQuickLinks } from "@/lib/constants/quickLinks";
import dynamic from "next/dynamic";
import { DeferredRender } from "@/components/DeferredRender";

// Header is client-only (zustand stores + auth fetch).
// HeaderSkeleton is rendered server-side to reserve space and prevent CLS.
const Header = dynamic(() => import("@/components/Header").then((m) => m.Header), {
  ssr: false,
  loading: () => <HeaderSkeleton />,
});
const QuickFilters = dynamic(
  () => import("@/components/QuickFilters").then((m) => m.QuickFilters),
  { ssr: false }
);
const MobileBottomNav = dynamic(
  () => import("@/components/MobileBottomNav").then((m) => m.MobileBottomNav),
  { ssr: false }
);
const CookieBanner = dynamic(
  () => import("@/components/CookieBanner").then((m) => m.CookieBanner),
  { ssr: false }
);
const ChatWidget = dynamic(
  () => import("@/components/ChatWidget").then((m) => m.ChatWidget),
  { ssr: false }
);

const getSiteConfig = unstable_cache(
  async () => {
    try {
      const [contacts, home] = await Promise.all([
        getPageContent("contacts"),
        getPageContent("home"),
      ]);
      const weekdays = (contacts.hours_weekdays ?? "").trim();
      const workingHours = weekdays || CONTACTS.workingHours;
      const enabledSlugs: string[] = Array.isArray((home as any).quick_filter_slugs)
        ? (home as any).quick_filter_slugs
        : [];
      return { workingHours, enabledSlugs };
    } catch {
      return { workingHours: CONTACTS.workingHours, enabledSlugs: [] };
    }
  },
  ["site-config"],
  { revalidate: 300, tags: ["site-config"] }
);

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { workingHours, enabledSlugs } = await getSiteConfig();
  const currentYear = new Date().getFullYear();

  // Filter QuickFilters: only slugs enabled by admin AND have at least one product
  // "all" is always shown if enabled (it's not a real category slug in DB)
  const slugsWithProducts = await getCategorySlugsWithProducts().catch((error) => {
    console.error("CATEGORY QUICK FILTERS ERROR:", error);
    return [] as string[];
  });
  const activeQuickSlugs = getActiveQuickLinks(enabledSlugs, slugsWithProducts)
    .map((link) => link.slug);

  return (
    <>
      <Header />
      <QuickFilters enabledSlugs={activeQuickSlugs} />
      <main className="flex-grow">
        {children}
      </main>
      <div className="h-24 lg:hidden" />
      <Footer workingHours={workingHours} currentYear={currentYear} />

      <MobileBottomNav />
      <CookieBanner />
      <DeferredRender delayMs={5000}>
        <ChatWidget />
      </DeferredRender>
    </>
  );
}
