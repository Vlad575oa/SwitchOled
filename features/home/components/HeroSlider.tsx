"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    image: "/images/hero/desktop-retro.webp",
    video: "/videos/hero/hero-1-full",
    imagePosition: "",
    imageMobile: "/images/hero/mobile-1.webp",
    title: "Прошитые Switch OLED, готовые к игре",
    text: "Настроены, проверены и укомплектованы играми. Гарантия 1 год.",
    cta: "Смотреть каталог",
    href: "#catalog",
    perks: ["🔧 Мы прошиваем консоли", "🏅 Гарантия 1 год", "100% Оригинал"],
  },
  {
    image: "/images/hero/desktop-consoles.webp",
    video: "/videos/hero/hero-2-full",
    // Ultra-wide photo: on narrow screens crop from the left so the consoles stay in view
    imagePosition: "sm:object-[72%_50%] lg:object-center",
    imageMobile: "/images/hero/mobile-2.webp",
    title: "OLED или Lite — поможем выбрать",
    text: "Подскажем модель под ваш бюджет и любимые игры.",
    cta: "Сравнить модели",
    href: "/catalog/nintendo-switch-oled",
    perks: ["⭐ 5.0 • 1000+ отзывов", "🚚 Быстрая доставка"],
  },
  {
    image: "/images/hero/desktop-shelf.webp",
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

// Desktop: a slide shows its photo this long, then its clip plays once
const IMAGE_MS = 5000;
// Without clips (phones) a slide stays this long
const PHOTO_SLIDE_MS = 7000;
// If a clip has not started this long after its turn, move on to the next slide
const VIDEO_START_TIMEOUT_MS = 8000;

type Slide = (typeof SLIDES)[number];
type SlideState = { index: number; phase: "image" | "video"; playing: boolean };

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
  play: boolean;
  onBuffered: () => void;
  onPlaying: () => void;
  onEnded: () => void;
};

// Muted desktop clip. It sits hidden over the photo, starts from the beginning when its turn
// comes (`play`), fades in once it actually plays and is hidden again as soon as the turn is over.
function SlideVideo({ slide, play, onBuffered, onPlaying, onEnded }: SlideVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (play) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
      setVisible(false);
    }
  }, [play]);

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
        if (!play) return;
        setVisible(true);
        onPlaying();
      }}
      onEnded={onEnded}
      className={cn(
        "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
        visible ? "opacity-100" : "opacity-0",
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
// Every slide: photo for IMAGE_MS, then its clip once, then the next slide.
// Loading order: all photos first (so manual swiping is instant), then the clips one by one.
export function HeroSlider() {
  const [{ index, phase, playing }, setState] = useState<SlideState>({ index: 0, phase: "image", playing: false });
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  // A clip that ended under the pointer: the slider moves on once the pointer leaves
  const endedWhilePaused = useRef(false);
  // Slides whose photo has finished loading
  const [photoReady, setPhotoReady] = useState<number[]>([]);
  // How many clips may download, in order: the next one starts once the previous is buffered
  const [videoQueue, setVideoQueue] = useState(0);
  const videoAllowed = useVideoAllowed();
  const markPhotoReady = useRef(
    SLIDES.map((_, i) => () => setPhotoReady((r) => (r.includes(i) ? r : [...r, i]))),
  ).current;

  // Any change of slide (auto, arrows, dots) starts again from its photo
  const goTo = useCallback((next: number) => {
    endedWhilePaused.current = false;
    setState({ index: next, phase: "image", playing: false });
  }, []);
  const go = useCallback((dir: number) => {
    endedWhilePaused.current = false;
    setState((s) => ({ index: (s.index + dir + SLIDES.length) % SLIDES.length, phase: "image", playing: false }));
  }, []);
  const startVideo = useCallback(() => setState((s) => ({ ...s, phase: "video" })), []);
  const markPlaying = useCallback(() => setState((s) => (s.phase === "video" ? { ...s, playing: true } : s)), []);

  useEffect(() => {
    if (photoReady.length === SLIDES.length) setVideoQueue((q) => Math.max(q, 1));
  }, [photoReady]);

  useEffect(() => {
    if (paused) return;
    let ms: number;
    let action: () => void;
    if (phase === "image") {
      // Photo first; with clips it hands over to the clip, without them (phones) it just moves on
      ms = videoAllowed ? IMAGE_MS : PHOTO_SLIDE_MS;
      action = videoAllowed ? startVideo : () => go(1);
    } else if (!playing) {
      // The clip's turn came but it has not started (still loading or failed): do not get stuck
      ms = VIDEO_START_TIMEOUT_MS;
      action = () => go(1);
    } else {
      return; // the clip is playing: its end moves the slider on
    }
    const t = setTimeout(action, ms);
    return () => clearTimeout(t);
  }, [index, phase, playing, paused, videoAllowed, go, startVideo]);

  const handleEnded = useCallback(() => {
    // Under the pointer the slide stays put (and the clip is not replayed)
    if (pausedRef.current) endedWhilePaused.current = true;
    else go(1);
  }, [go]);

  useEffect(() => {
    if (!paused && endedWhilePaused.current) {
      endedWhilePaused.current = false;
      go(1);
    }
  }, [paused, go]);

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
                play={i === index && phase === "video"}
                onBuffered={() => setVideoQueue((q) => Math.max(q, i + 2))}
                onPlaying={markPlaying}
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
              onClick={() => goTo(i)}
              aria-label={`Слайд ${i + 1}`}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-white" : "w-1.5 bg-white/50")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
