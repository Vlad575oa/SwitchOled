"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface FavoriteItem {
  id: number;
  name: string;
  fullName: string;
  href: string;
  image: string;
  price: number;
  badge: string | null;
}

// Horizontal rail of tall product tiles; the name sits in a notch tab cut into the tile corner.
export function FavoritesRail({ items }: { items: FavoriteItem[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollNext = () => {
    const el = ref.current;
    if (!el) return;
    const tile = el.firstElementChild as HTMLElement | null;
    const step = tile ? tile.offsetWidth + 12 : el.clientWidth / 2;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
  };

  return (
    <div className="relative mt-3">
      <div ref={ref} className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            title={item.fullName}
            className="group relative shrink-0 snap-start w-[calc(50%-6px)] lg:w-[calc(25%-9px)] aspect-[3/4] rounded-3xl bg-surface-tile overflow-hidden"
          >
            <Image
              src={item.image}
              alt={item.fullName}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-contain p-6 lg:p-12 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04]"
            />

            <span className="notch-tl absolute left-0 top-0 max-w-[78%] pl-3 lg:pl-5 pr-4 lg:pr-6 py-2.5 lg:py-3 text-[13px] lg:text-[16px] font-medium text-black truncate">
              {item.name}
            </span>

            {item.badge && (
              <span className="absolute right-3 lg:right-5 top-11 lg:top-5 rounded-md bg-black px-2.5 py-1 text-[12px] lg:text-[13px] font-medium text-white">
                {item.badge}
              </span>
            )}

            <span className="absolute left-3 lg:left-5 bottom-3 lg:bottom-5 rounded-lg bg-white px-3 py-1.5 text-[14px] lg:text-[16px] font-semibold text-black">
              {formatPrice(item.price)}
            </span>
          </Link>
        ))}
      </div>

      {items.length > 4 && (
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Ещё товары"
          className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg bg-black/10 hover:bg-black/20 backdrop-blur items-center justify-center text-white transition-colors"
        >
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  );
}
