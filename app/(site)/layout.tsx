import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { Suspense } from "react";
import { readFile } from "fs/promises";
import { join } from "path";
import { CONTACTS } from "@/lib/constants/contacts";
import { getCategorySlugsWithProducts } from "@/lib/queries";
import { ALL_QUICK_LINKS } from "@/lib/constants/quickLinks";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/Header").then((m) => m.Header), {
  ssr: false,
});
const QuickFilters = dynamic(
  () => import("@/components/QuickFilters").then((m) => m.QuickFilters),
  { ssr: false }
);
const FloatingContact = dynamic(
  () => import("@/components/FloatingContact").then((m) => m.FloatingContact),
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

const getSiteConfig = async () => {
  try {
    const raw = await readFile(join(process.cwd(), "content", "pages.json"), "utf-8");
    const parsed = JSON.parse(raw);
    const contacts = (parsed?.contacts ?? {}) as Record<string, string>;
    const weekdays = (contacts.hours_weekdays ?? "").trim();
    const workingHours = weekdays || CONTACTS.workingHours;
    const enabledSlugs: string[] = Array.isArray(parsed?.home?.quick_filter_slugs)
      ? parsed.home.quick_filter_slugs
      : [];
    return { workingHours, enabledSlugs };
  } catch {
    return { workingHours: CONTACTS.workingHours, enabledSlugs: [] };
  }
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { workingHours, enabledSlugs } = await getSiteConfig();
  const currentYear = new Date().getFullYear();

  // Filter QuickFilters: only slugs enabled by admin AND have at least one product
  // "all" is always shown if enabled (it's not a real category slug in DB)
  const slugsWithProducts = await getCategorySlugsWithProducts();
  const activeQuickSlugs = (enabledSlugs.length > 0 ? enabledSlugs : ALL_QUICK_LINKS.map((l) => l.slug))
    .filter((slug) => slug === "all" || slugsWithProducts.includes(slug));

  return (
    <>
      <TopBar workingHours={workingHours} />
      <Header />
      <Suspense fallback={null}>
        <QuickFilters enabledSlugs={activeQuickSlugs} />
      </Suspense>
      <main className="flex-grow">
        {children}
      </main>
      <div className="h-14 lg:hidden" />
      <Footer workingHours={workingHours} currentYear={currentYear} />

      <MobileBottomNav />
      <CookieBanner />
      <ChatWidget />
    </>
  );
}
