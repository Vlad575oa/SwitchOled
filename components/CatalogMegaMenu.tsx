"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface SubLink {
  label: string;
  href: string;
  badge?: string;
}

interface PlatformGroup {
  title: string;
  href: string;
  emoji: string;
  color: string;
  links: SubLink[];
}

// Static class names so Tailwind generates them (dynamic `grid-cols-${n}` is purged).
const GRID_COLS: Record<number, string> = {
  1: "grid gap-6 grid-cols-1",
  2: "grid gap-6 grid-cols-2",
  3: "grid gap-6 grid-cols-3",
  4: "grid gap-6 grid-cols-2 md:grid-cols-4",
};

// Extract category slug from href (ignores query params)
const hrefToSlug = (href: string): string => {
  if (href === "/catalog/all") return "all";
  const path = href.split("?")[0]; // strip query
  return path.replace("/catalog/", "").split("/")[0] || "all";
};

const PLATFORMS: PlatformGroup[][] = [
  // Column 1 — PlayStation
  [
    {
      title: "PlayStation 5",
      href: "/catalog/ps5",
      emoji: "🎮",
      color: "bg-blue-50 text-blue-600",
      links: [
        { label: "Консоли PS5", href: "/catalog/ps5" },
        { label: "PS5 Pro", href: "/catalog/ps5-pro" },
        { label: "PS5 Slim", href: "/catalog/ps5-slim" },
        { label: "Аксессуары PS5", href: "/catalog/accessories?q=ps5" },
      ],
    },
    {
      title: "PlayStation 4",
      href: "/catalog/playstation",
      emoji: "🕹️",
      color: "bg-blue-50 text-blue-500",
      links: [
        { label: "Консоли PS4", href: "/catalog/playstation" },
        { label: "Аксессуары PS4", href: "/catalog/accessories?q=ps4" },
      ],
    },
  ],
  // Column 2 — Nintendo (PRIORITY)
  [
    {
      title: "Nintendo Switch 2",
      href: "/catalog/nintendo-switch-2",
      emoji: "⚡",
      color: "bg-red-50 text-red-500",
      links: [
        { label: "Консоли Switch 2", href: "/catalog/nintendo-switch-2", badge: "NEW" },
        { label: "Аксессуары Switch 2", href: "/catalog/accessories?q=switch2" },
      ],
    },
    {
      title: "Nintendo Switch",
      href: "/catalog/nintendo-switch",
      emoji: "🔴",
      color: "bg-red-50 text-red-400",
      links: [
        { label: "Консоли Switch", href: "/catalog/nintendo-switch" },
        { label: "Switch OLED", href: "/catalog/nintendo-switch-oled" },
        { label: "Switch Lite", href: "/catalog/nintendo-switch-lite" },
        { label: "Аксессуары Switch", href: "/catalog/accessories?q=switch" },
      ],
    },
  ],
  // Column 3 — Xbox
  [
    {
      title: "Xbox Series X/S",
      href: "/catalog/xbox",
      emoji: "🎯",
      color: "bg-green-50 text-green-600",
      links: [
        { label: "Xbox Series X", href: "/catalog/xbox-series-x" },
        { label: "Xbox Series S", href: "/catalog/xbox-series-s" },
        { label: "Аксессуары Xbox", href: "/catalog/accessories?q=xbox" },
        { label: "Game Pass", href: "/catalog/accessories?q=gamepass" },
      ],
    },
    {
      title: "Xbox One",
      href: "/catalog/xbox",
      emoji: "🎲",
      color: "bg-green-50 text-green-500",
      links: [
        { label: "Консоли Xbox One", href: "/catalog/xbox" },
        { label: "Аксессуары Xbox One", href: "/catalog/accessories?q=xbox-one" },
      ],
    },
  ],
  // Column 4 — Other
  [
    {
      title: "Steam Deck",
      href: "/catalog/steam-deck",
      emoji: "💻",
      color: "bg-purple-50 text-purple-600",
      links: [
        { label: "Консоли Steam Deck", href: "/catalog/steam-deck" },
        { label: "Аксессуары Steam Deck", href: "/catalog/accessories?q=steamdeck" },
      ],
    },
    {
      title: "Аксессуары",
      href: "/catalog/accessories",
      emoji: "🛒",
      color: "bg-orange-50 text-orange-500",
      links: [
        { label: "Все аксессуары", href: "/catalog/accessories" },
        { label: "Геймпады", href: "/catalog/gamepads" },
        { label: "Подарочные карты", href: "/catalog/accessories?q=card" },
      ],
    },
    {
      title: "Игры",
      href: "/catalog/games",
      emoji: "🎮",
      color: "bg-pink-50 text-pink-600",
      links: [
        { label: "Все игры", href: "/catalog/games" },
        { label: "Предзаказы", href: "/catalog/games?status=onOrder", badge: "NEW" },
      ],
    },
  ],
];

interface CatalogMegaMenuProps {
  onClose: () => void;
}

export function CatalogMegaMenu({ onClose }: CatalogMegaMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [availableSlugs, setAvailableSlugs] = useState<Set<string> | null>(null);

  useEffect(() => {
    fetch("/api/catalog-slugs")
      .then((r) => r.json())
      .then((slugs: string[]) => {
        if (Array.isArray(slugs) && slugs.length > 0) {
          const slugSet = new Set(slugs);
          slugSet.add("all");
          setAvailableSlugs(slugSet);
        } else {
          setAvailableSlugs(null);
        }
      })
      .catch(() => setAvailableSlugs(null));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Filter a group's sub-links to only those whose category has products
  const filterLinks = (links: SubLink[]): SubLink[] => {
    if (!availableSlugs) return links;
    return links.filter((l) => availableSlugs.has(hrefToSlug(l.href)));
  };

  // A group is visible if it has at least one visible sub-link OR its own slug has products
  const isGroupVisible = (group: PlatformGroup): boolean => {
    if (!availableSlugs) return true;
    const ownSlug = hrefToSlug(group.href);
    if (availableSlugs.has(ownSlug)) return true;
    return filterLinks(group.links).length > 0;
  };

  // Filter columns to only those with at least one visible group
  const visibleColumns = PLATFORMS.map((col) => col.filter(isGroupVisible)).filter((col) => col.length > 0);
  const finalColumns = visibleColumns.length > 0 ? visibleColumns : PLATFORMS;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-150" onClick={onClose} />

      {/* Panel: compact dropdown card under the "Каталог" button */}
      <div
        ref={ref}
        className="absolute left-0 top-2 z-50 w-[min(860px,calc(100vw-24px))] rounded-2xl bg-white border border-neutral-200 shadow-xl p-6 animate-in fade-in slide-in-from-top-1 duration-150"
      >
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-3 right-3 w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 transition-colors"
        >
          <X size={14} />
        </button>

        <div className={GRID_COLS[Math.min(finalColumns.length, 4)] ?? GRID_COLS[4]}>
          {finalColumns.map((column, colIdx) => (
            <div key={colIdx} className="space-y-5">
              {column.map((group) => {
                const visibleLinks = filterLinks(group.links);
                return (
                  <div key={group.title}>
                    <Link
                      href={group.href}
                      onClick={onClose}
                      className="flex items-center gap-2 mb-2 group"
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[13px] ${group.color}`}>
                        {group.emoji}
                      </span>
                      <span className="text-[14px] font-semibold text-black group-hover:text-black/60 transition-colors">
                        {group.title}
                      </span>
                    </Link>
                    <ul className="space-y-1.5 pl-9">
                      {visibleLinks.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 text-[13px] text-black/55 hover:text-black transition-colors"
                          >
                            {link.label}
                            {link.badge && (
                              <span className="px-1.5 py-0.5 bg-black text-white text-[9px] font-semibold rounded-full uppercase">
                                {link.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
