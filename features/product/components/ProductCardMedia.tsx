"use client";

import { useState } from "react";
import type { UIEvent } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductCardMediaProps {
  images: string[];
  name: string;
  eagerImage?: boolean;
}

export function ProductCardMedia({ images, name, eagerImage = false }: ProductCardMediaProps) {
  const safeImages = images.length > 0 ? images : ["/placeholder.jpg"];
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (safeImages.length <= 1) return;

    const nextIndex = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
    const clamped = Math.max(0, Math.min(nextIndex, safeImages.length - 1));

    setActiveIndex(clamped);
  };

  return (
    <div className="mb-1.5">
      <div className="sm:hidden">
        <div
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar rounded-[24px]"
          onScroll={handleScroll}
        >
          {safeImages.map((img, index) => (
            <div key={`${img}-${index}`} className="relative flex-none w-full snap-start">
              <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[24px] bg-neutral-50">
                <Image
                  src={img}
                  alt={`${name} — Фото ${index + 1}`}
                  title={`${name} — Ракурс ${index + 1}`}
                  fill
                  sizes="50vw"
                  quality={40}
                  priority={eagerImage && index === 0}
                  loading={eagerImage && index === 0 ? "eager" : "lazy"}
                  fetchPriority={eagerImage && index === 0 ? "high" : "auto"}
                  className="object-contain p-0 transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>

        {safeImages.length > 1 && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {safeImages.map((img, index) => (
              <span
                key={`${img}-dot-${index}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-neutral-300"
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="hidden sm:block relative aspect-[16/12]">
        <Image
          src={safeImages[0]}
          alt={`${name} — Фото в Gameshop24`}
          title={`${name} — Купить с гарантией 1 год`}
          fill
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, (max-width: 1280px) 22vw, 16vw"
          quality={40}
          priority={eagerImage}
          loading={eagerImage ? "eager" : "lazy"}
          fetchPriority={eagerImage ? "high" : "auto"}
          className="object-contain p-0 transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </div>
  );
}
