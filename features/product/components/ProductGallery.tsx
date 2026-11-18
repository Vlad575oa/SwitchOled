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
    <div className="flex flex-col md:flex-row gap-3 md:gap-6 h-auto md:h-[560px] lg:h-[calc(100svh-120px)] lg:min-h-[600px] lg:max-h-[860px]">

      {/* Thumbnails — horizontal under image on mobile, vertical column on desktop */}
      <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto no-scrollbar py-1 md:w-[72px] shrink-0 snap-x snap-mandatory">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            aria-label={`Фото ${i + 1}`}
            className={cn(
              "relative w-16 h-16 md:w-full md:h-auto md:aspect-square rounded-lg overflow-hidden border-2 bg-surface-soft flex-shrink-0 snap-start transition-colors",
              activeIndex === i ? "border-black" : "border-transparent hover:border-neutral-300"
            )}
          >
            <Image
              src={img}
              alt={`${name} — Фото ${i + 1}`}
              title={`${name} — Ракурс ${i + 1}`}
              fill
              className="object-contain p-1.5 mix-blend-multiply"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div
        className="order-1 md:order-2 relative bg-surface-soft rounded-3xl overflow-hidden group h-[360px] sm:h-[440px] md:flex-1 md:h-full"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={images[activeIndex] || "/images/placeholder.webp"}
          alt={`${name} — Оригинальное фото в Switch OLED`}
          title={`${name} — Купить с гарантией 1 год`}
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-contain p-8 md:p-16 mix-blend-multiply"
          priority
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity active:scale-95"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity active:scale-95"
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
