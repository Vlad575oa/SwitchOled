"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    image: "/images/blog/nintendo-switch-chipped-guide.webp",
    title: "Прошитые Switch OLED, готовые к игре",
    text: "Настроены, проверены и укомплектованы играми. Гарантия 1 год.",
    cta: "Смотреть каталог",
    href: "#catalog",
  },
  {
    image: "/images/blog/nintendo-switch-oled-vs-lite-guide.webp",
    title: "OLED или Lite — поможем выбрать",
    text: "Подскажем модель под ваш бюджет и любимые игры.",
    cta: "Сравнить модели",
    href: "/catalog/nintendo-switch-oled",
  },
  {
    image: "/images/blog/nintendo-switch-2026-guide.webp",
    title: "100+ игр уже в комплекте",
    text: "Установим любые игры и подготовим консоль к первому запуску.",
    cta: "Выбрать консоль",
    href: "/catalog/nintendo-switch-oled",
  },
];

// Full-width rounded hero that slides under the header's notch tabs.
export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (dir: number) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(1), 7000);
    return () => clearTimeout(t);
  }, [index, paused]);

  const slide = SLIDES[index];

  return (
    <section
      className="px-3 -mt-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="relative h-[520px] sm:h-[600px] lg:h-[calc(100svh-140px)] lg:min-h-[620px] lg:max-h-[860px] rounded-3xl overflow-hidden bg-neutral-900">
        {SLIDES.map((s, i) => (
          <Image
            key={s.image}
            src={s.image}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={cn(
              "object-cover transition-opacity duration-700",
              i === index ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
        <div className="absolute inset-0 bg-black/15" />

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Предыдущий слайд"
          className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 p-2 text-white/90 hover:text-white transition-colors"
        >
          <ChevronLeft size={30} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Следующий слайд"
          className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 p-2 text-white/90 hover:text-white transition-colors"
        >
          <ChevronRight size={30} strokeWidth={1.5} />
        </button>

        {/* Desktop card */}
        <div className="hidden sm:block absolute left-8 lg:left-14 bottom-8 lg:bottom-14 w-[440px] lg:w-[480px] rounded-xl bg-white p-9 lg:p-12">
          <p key={slide.title} className="text-[32px] lg:text-[38px] font-medium leading-[1.15] tracking-[-0.02em] text-black animate-in fade-in duration-500">
            {slide.title}
          </p>
          <p className="mt-4 text-[17px] leading-[1.6] text-black/50">{slide.text}</p>
          <Link href={slide.href} className="inline-block mt-8 text-[16px] font-medium text-black underline underline-offset-4 decoration-1 hover:text-black/60">
            {slide.cta}
          </Link>
        </div>

        {/* Mobile card */}
        <div className="sm:hidden absolute left-6 right-6 bottom-6 rounded-xl bg-white px-5 py-5 flex items-center justify-between gap-4">
          <p className="text-[18px] font-medium leading-[1.25] tracking-[-0.01em] text-black">{slide.title}</p>
          <Link href={slide.href} className="shrink-0 text-[15px] font-medium text-black underline underline-offset-4 decoration-1">
            Смотреть
          </Link>
        </div>

        <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 hidden sm:flex gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.image}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Слайд ${i + 1}`}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-white" : "w-1.5 bg-white/50")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
