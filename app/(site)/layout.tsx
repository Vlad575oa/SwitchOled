import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { Suspense } from "react";
import { readFile } from "fs/promises";
import { join } from "path";
import { CONTACTS } from "@/lib/constants/contacts";
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

  return (
    <>
      <TopBar workingHours={workingHours} />
      <Header />
      <Suspense fallback={null}>
        <QuickFilters enabledSlugs={enabledSlugs} />
      </Suspense>
      <main className="flex-grow">
        {children}
      </main>
      <div className="h-14 lg:hidden" />
      <Footer workingHours={workingHours} currentYear={currentYear} />
      <FloatingContact />
      <MobileBottomNav />
      <CookieBanner />
    </>
  );
}
