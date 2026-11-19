"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    image: "/images/hero/desktop-1-full.webp",
    video: "/videos/hero/hero-1-full",
    // Where narrow screens crop the wide photo: keep the consoles in view
    imagePosition: "sm:object-[72%_50%] lg:object-center",
    imageMobile: "/images/hero/mobile-1.webp",
    title: "Прошитые Switch OLED, готовые к игре",
    text: "Настроены, проверены и укомплектованы играми. Гарантия 1 год.",
    cta: "Смотреть каталог",
    href: "#catalog",
    perks: ["🔧 Мы прошиваем консоли", "🏅 Гарантия 1 год", "100% Оригинал"],
  },
  {
    image: "/images/hero/desktop-2-shelf-full.webp",
    video: "/videos/hero/hero-2-full",
    imagePosition: "",
    imageMobile: "/images/hero/mobile-2.webp",
    title: "OLED или Lite — поможем выбрать",
    text: "Подскажем модель под ваш бюджет и любимые игры.",
    cta: "Сравнить модели",
    href: "/catalog/nintendo-switch-oled",
    perks: ["⭐ 5.0 • 1000+ отзывов", "🚚 Быстрая доставка"],
  },
  {
    image: "/images/hero/desktop-3-retro-full.webp",
    video: "/videos/hero/hero-3-full",
    imagePosition: "",
    imageMobile: "/images/hero/mobile-3.webp",
    title: "100+ игр уже в комплекте",
    text: "Установим любые игры и подготовим консоль к первому запуску.",
    cta: "Выбрать консоль",
    href: "/catalog/nintendo-switch-oled",
    perks: ["100% Оригинал", "🏅 Гарантия 1 год", "🚚 Быстрая доставка"],
  },
];

// Fallback slide length when there is no clip (phones) or it has not started yet
const PHOTO_SLIDE_MS = 7000;

type Slide = (typeof SLIDES)[number];

// One <picture> per slide, so each device downloads only its own crop:
// the wide photo from 640px up, the vertical 9:16 photo on phones.
function SlidePicture({ slide, priority, onLoad }: { slide: Slide; priority: boolean; onLoad: () => void }) {
  const ref = useRef<HTMLImageElement>(null);
  const common = { alt: "", fill: true, sizes: "100vw", priority };
  const { props: { srcSet: desktopSrcSet } } = getImageProps({ ...common, src: slide.image });
  const { props: { srcSet: mobileSrcSet, ...img } } = getImageProps({ ...common, src: slide.imageMobile });

  // A cached photo can finish loading before hydration, when onLoad is not attached yet
  useEffect(() => {
    if (ref.current?.complete) onLoad();
  }, [onLoad]);

  return (
    <picture>
      <source media="(min-width: 640px)" srcSet={desktopSrcSet} sizes="100vw" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...img} ref={ref} onLoad={onLoad} srcSet={mobileSrcSet} className={cn("object-cover", slide.imagePosition)} />
    </picture>
  );
}

const isFullyBuffered = (video: HTMLVideoElement) =>
  video.buffered.length > 0 && video.duration > 0 && video.buffered.end(video.buffered.length - 1) >= video.duration - 0.1;

type SlideVideoProps = {
  slide: Slide;
  active: boolean;
  onBuffered: () => void;
  onPlaying: () => void;
  onEnded: (video: HTMLVideoElement) => void;
};

// Muted desktop clip that fades in over the slide photo once it actually plays.
// The active clip restarts from the beginning; when it ends the slider moves on.
function SlideVideo({ slide, active, onBuffered, onPlaying, onEnded }: SlideVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (active) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active]);

  const checkBuffered = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (isFullyBuffered(e.currentTarget)) onBuffered();
  };

  return (
    <video
      ref={ref}
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      onProgress={checkBuffered}
      onCanPlayThrough={checkBuffered}
      onPlaying={() => {
        setPlaying(true);
        if (active) onPlaying();
      }}
      onEnded={(e) => onEnded(e.currentTarget)}
      className={cn(
        "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
        slide.imagePosition,
        playing ? "opacity-100" : "opacity-0",
      )}
    >
      <source src={`${slide.video}.webm`} type="video/webm" />
      <source src={`${slide.video}.mp4`} type="video/mp4" />
    </video>
  );
}

// Clips are desktop only (wide screen + mouse/trackpad, so tablets are excluded)
// and skipped for reduced motion or data saver
function useVideoAllowed() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const update = () => setAllowed(wide.matches && !calm.matches && !saveData);
    update();
    wide.addEventListener("change", update);
    calm.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      calm.removeEventListener("change", update);
    };
  }, []);
  return allowed;
}

// Full-width rounded hero that slides under the header's notch tabs.
// Loading order: all photos first (so manual swiping is instant), then the clips one by one.
export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  // Slides whose photo has finished loading
  const [photoReady, setPhotoReady] = useState<number[]>([]);
  // How many clips may download, in order: the next one starts once the previous is buffered
  const [videoQueue, setVideoQueue] = useState(0);
  // Slide whose clip is currently playing: it drives the slider instead of the timer
  const [videoPlaying, setVideoPlaying] = useState<number | null>(null);
  const videoAllowed = useVideoAllowed();
  const markPhotoReady = useRef(
    SLIDES.map((_, i) => () => setPhotoReady((r) => (r.includes(i) ? r : [...r, i]))),
  ).current;
  const go = useCallback((dir: number) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (photoReady.length === SLIDES.length) setVideoQueue((q) => Math.max(q, 1));
  }, [photoReady]);

  useEffect(() => {
    if (paused || videoPlaying === index) return;
    const t = setTimeout(() => go(1), PHOTO_SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, videoPlaying, go]);

  const handleEnded = useCallback(
    (video: HTMLVideoElement) => {
      // While the pointer is over the hero, replay the clip instead of moving on
      if (pausedRef.current) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        go(1);
      }
    },
    [go],
  );

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
            <SlidePicture slide={s} priority={i === 0} onLoad={markPhotoReady[i]} />
            {videoAllowed && videoQueue > 0 && (i < videoQueue || i === index) && (
              <SlideVideo
                slide={s}
                active={i === index}
                onBuffered={() => setVideoQueue((q) => Math.max(q, i + 2))}
                onPlaying={() => setVideoPlaying(i)}
                onEnded={handleEnded}
              />
            )}
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
