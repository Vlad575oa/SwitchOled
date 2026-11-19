"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    image: "/images/hero/desktop-1.webp",
    imageMobile: "/images/hero/mobile-1.webp",
    title: "Прошитые Switch OLED, готовые к игре",
    text: "Настроены, проверены и укомплектованы играми. Гарантия 1 год.",
    cta: "Смотреть каталог",
    href: "#catalog",
    perks: ["🔧 Мы прошиваем консоли", "🏅 Гарантия 1 год", "100% Оригинал"],
  },
  {
    image: "/images/hero/desktop-2.webp",
    imageMobile: "/images/hero/mobile-2.webp",
    title: "OLED или Lite — поможем выбрать",
    text: "Подскажем модель под ваш бюджет и любимые игры.",
    cta: "Сравнить модели",
    href: "/catalog/nintendo-switch-oled",
    perks: ["⭐ 5.0 • 1000+ отзывов", "🚚 Быстрая доставка"],
  },
  {
    image: "/images/hero/desktop-3.webp",
    imageMobile: "/images/hero/mobile-3.webp",
    title: "100+ игр уже в комплекте",
    text: "Установим любые игры и подготовим консоль к первому запуску.",
    cta: "Выбрать консоль",
    href: "/catalog/nintendo-switch-oled",
    perks: ["100% Оригинал", "🏅 Гарантия 1 год", "🚚 Быстрая доставка"],
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
          <div key={s.image} className={cn("absolute inset-0 transition-opacity duration-700", i === index ? "opacity-100" : "opacity-0")}>
            {/* Wide photo on tablets/desktop, vertical 9:16 photo on phones.
                Consoles sit right of center, so narrow tablets crop from the left. */}
            <Image src={s.image} alt="" fill priority={i === 0} sizes="100vw" className="hidden sm:block object-cover object-[72%_50%] lg:object-center" />
            <Image src={s.imageMobile} alt="" fill priority={i === 0} sizes="100vw" className="sm:hidden object-cover" />
          </div>
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

        {/* Desktop perks: top-right, over the empty wall of each photo (narrower screens crop it) */}
        <ul key={`perks-${index}`} className="hidden xl:flex absolute right-14 top-28 flex-col items-end gap-2.5 animate-in fade-in duration-500">
          {slide.perks.map((perk) => (
            <li key={perk} className="rounded-full bg-white/90 backdrop-blur px-5 py-2.5 text-[16px] font-medium text-black shadow-sm">
              {perk}
            </li>
          ))}
        </ul>

        {/* Desktop card */}
        <div className="hidden sm:block absolute left-8 xl:left-14 bottom-8 xl:bottom-14 w-[400px] xl:w-[440px] rounded-xl bg-white p-7 xl:p-8">
          <p key={slide.title} className="text-[28px] xl:text-[34px] font-medium leading-[1.1] tracking-[-0.02em] text-black animate-in fade-in duration-500">
            {slide.title}
          </p>
          <p className="mt-2.5 text-[16px] leading-[1.45] text-black/50">{slide.text}</p>
          <Link href={slide.href} className="inline-block mt-5 text-[16px] font-medium text-black underline underline-offset-4 decoration-1 hover:text-black/60">
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
