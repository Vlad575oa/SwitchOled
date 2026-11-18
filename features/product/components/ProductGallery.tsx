"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSelectedVariantStore } from "@/features/product/store/useSelectedVariantStore";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images: initialImages, name }: ProductGalleryProps) {
  const variantImages = useSelectedVariantStore((s) => s.images);
  const images = variantImages ?? initialImages;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => { setActiveIndex(0); }, [images]);
  const touchStartX = useRef<number | null>(null);

  const nextImage = () => setActiveIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? nextImage() : prevImage();
    touchStartX.current = null;
  };

  if (!images.length) return null;

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 h-auto md:h-[540px] lg:h-[600px]">

      {/* Thumbnails — horizontal under image on mobile, vertical on desktop */}
      <div className="order-2 md:order-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto py-1 md:w-20 shrink-0 snap-x snap-mandatory">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              "relative aspect-square w-16 h-16 md:w-full md:h-auto md:aspect-square rounded-xl overflow-hidden border-2 transition-all p-1 bg-white flex-shrink-0 snap-start",
              activeIndex === i ? "border-primary shadow-md" : "border-neutral-100 hover:border-neutral-300"
            )}
          >
            <Image
              src={img}
              alt={`${name} — Фото ${i + 1}`}
              title={`${name} — Ракурс ${i + 1}`}
              fill
              className="object-contain p-1"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div
        className="order-1 md:order-2 relative bg-neutral-50 border border-neutral-100 rounded-lg md:rounded-lg overflow-hidden group h-[320px] sm:h-[380px] md:flex-1 md:h-full"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={images[activeIndex] || "/images/placeholder.webp"}
          alt={`${name} — Оригинальное фото в Gameshop24`}
          title={`${name} — Купить с гарантией 1 год`}
          fill
          className="object-contain p-6 md:p-10"
          priority
        />

        {/* Navigation Arrows — always visible on mobile, hover on desktop */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 border border-neutral-100 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-all shadow-sm active:scale-95"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 border border-neutral-100 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-all shadow-sm active:scale-95"
              aria-label="Следующее фото"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

      </div>
    </div>
  );
}
