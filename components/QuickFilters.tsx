"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_QUICK_LINKS, type QuickLink } from "@/lib/constants/quickLinks";

interface QuickFiltersProps {
  enabledSlugs?: string[];
}

export const QuickFilters = ({ enabledSlugs }: QuickFiltersProps) => {
  const links: QuickLink[] = enabledSlugs && enabledSlugs.length > 0
    ? (ALL_QUICK_LINKS.filter((l) => enabledSlugs.includes(l.slug)) as QuickLink[])
    : (ALL_QUICK_LINKS as unknown as QuickLink[]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [isDragging, setIsDragging]         = useState(false);
  const [startX, setStartX]                 = useState(0);
  const [scrollLeft, setScrollLeft]         = useState(0);
  const pathname = usePathname();

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => { el.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current; if (!el) return;
    setIsDragging(true); setStartX(e.pageX - el.offsetLeft); setScrollLeft(el.scrollLeft);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return; e.preventDefault();
    const el = scrollRef.current; if (!el) return;
    el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX) * 2;
  };

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });

  const isLinkActive = (item: QuickLink) => pathname === `/catalog/${item.slug}`;

  const getLabel = (item: QuickLink) => {
    if (item.slug === "nintendo-switch-oled") {
      return { mobile: "OLED", desktop: item.label };
    }
    if (item.slug === "nintendo-switch-lite") {
      return { mobile: "LITE", desktop: item.label };
    }
    return { mobile: item.label, desktop: item.label };
  };

  const fadeCls = "absolute top-0 bottom-0 z-10 w-16 pointer-events-none flex items-center";

  return (
    <div className="relative z-40 bg-white border-b border-surface-soft lg:sticky lg:top-[156px]">
      <div className="relative">
        {canScrollLeft && (
          <div className={cn(fadeCls, "left-0 bg-gradient-to-r from-white to-transparent")}>
            <button onClick={() => scroll("left")} className="pointer-events-auto ml-2 w-7 h-7 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center hover:shadow-md transition-all">
              <ChevronLeft size={13} className="text-neutral-500" />
            </button>
          </div>
        )}

        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={onMouseMove}
          className={cn("w-full max-w-[1920px] mx-auto flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-3 px-4 lg:px-6 2xl:px-4 scroll-smooth", isDragging ? "cursor-grabbing select-none" : "cursor-default")}
        >
          {links.map((item) => {
            const active = isLinkActive(item);
            return (
              <Link
                key={item.slug}
                href={item.href}
                className={cn(
                  "relative text-[14px] xl:text-[15px] whitespace-nowrap px-4 py-2 rounded-full border transition-all shrink-0 active:scale-95",
                  active
                    ? "font-semibold bg-black border-black text-white"
                    : "font-medium border-[#cccccc] text-black hover:border-black"
                )}
              >
                <span className="sm:hidden">{getLabel(item).mobile}</span>
                <span className="hidden sm:inline">{getLabel(item).desktop}</span>
              </Link>
            );
          })}
        </div>

        {canScrollRight && (
          <div className={cn(fadeCls, "right-0 bg-gradient-to-l from-white to-transparent justify-end")}>
            <button onClick={() => scroll("right")} className="pointer-events-auto mr-2 w-7 h-7 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center hover:shadow-md transition-all">
              <ChevronRight size={13} className="text-neutral-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
