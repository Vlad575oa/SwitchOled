import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { QuickFilters } from "@/components/QuickFilters";
import { Footer } from "@/components/Footer";
import { FloatingContact } from "@/components/FloatingContact";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Suspense } from "react";
import { CookieBanner } from "@/components/CookieBanner";
import { readFile } from "fs/promises";
import { join } from "path";

const getWorkingHours = async () => {
  try {
    const raw = await readFile(join(process.cwd(), "content", "pages.json"), "utf-8");
    const parsed = JSON.parse(raw);
    const contacts = (parsed?.contacts ?? {}) as Record<string, string>;
    const weekdays = (contacts.hours_weekdays ?? "").trim();
    const weekends = (contacts.hours_weekends ?? "").trim();
    if (weekdays && weekends) return `Пн–Пт ${weekdays} · Сб–Вс ${weekends}`;
    return weekdays || weekends || "09:00 — 21:00";
  } catch {
    return "09:00 — 21:00";
  }
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workingHours = await getWorkingHours();

  return (
    <>
      <TopBar workingHours={workingHours} />
      <Header />
      <Suspense fallback={null}>
        <QuickFilters />
      </Suspense>
      <main className="flex-grow">
        {children}
      </main>
      <div className="h-14 lg:hidden" />
      <Footer workingHours={workingHours} />
      <FloatingContact />
      <MobileBottomNav />
      <CookieBanner />
    </>
  );
}
