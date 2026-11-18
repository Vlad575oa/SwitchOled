import Link from "next/link";
import Image from "next/image";
import { MapPin, ShieldCheck, Award, MessageCircle, Truck } from "lucide-react";
import { MaxContactLink } from "./MaxContactLink";
import { CONTACTS } from "@/lib/constants/contacts";

const MaxIcon = () => (
  <Image src="/icons/logotip-messendzhera-max.svg" alt="MAX" width={26} height={26} className="object-contain rounded-full" />
);

const WhatsAppIcon = () => (
  <span className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/12 px-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
    WA
  </span>
);

const TelegramIcon = () => (
  <Image src="/icons/telegram-svgrepo-com.svg" alt="Telegram" width={26} height={26} className="object-contain" />
);


export const TopBar = ({ workingHours = "09:00 — 21:00" }: { workingHours?: string }) => {
  const compactWorkingHours = workingHours
    .replace(/:00/g, "")
    .replace(/\s*—\s*/g, "-");

  return (
    <div className="sticky top-0 left-0 right-0 z-[60] bg-black text-white border-b border-white/10 transition-colors">
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:pl-6 lg:pr-4 2xl:pl-4 2xl:pr-4">
        {/* Mobile row 1: truck + phone + rating + messengers */}
        <div className="sm:hidden relative flex items-center justify-between gap-2 py-2 min-h-[48px]">
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/reviews"
              className="flex items-center gap-1 px-2 py-1 rounded-full border border-white/25 text-white text-[10px] font-black whitespace-nowrap"
            >
              <span className="animate-sparkle">⭐</span> 5.0
            </Link>
            <Link
              href="/delivery"
              className="flex items-center justify-center w-6 h-6 rounded-full border border-white/25 text-white shrink-0"
              aria-label="Быстрая доставка"
            >
              <Truck size={11} className="shrink-0" />
            </Link>
          </div>

          <a
            href={`tel:${CONTACTS.phoneHref}`}
            className="absolute left-1/2 -translate-x-1/2 inline-flex items-center px-2 py-1.5 rounded-full border border-white/25 text-white hover:text-white/80 hover:border-white/50 transition-colors"
          >
            <span className="text-[15px] font-black tracking-tight leading-none whitespace-nowrap">{CONTACTS.phoneDisplay}</span>
          </a>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={CONTACTS.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center hover:scale-110 transition-all drop-shadow-sm"
              title="Telegram"
            >
              <TelegramIcon />
            </a>
            <Link
              href={`https://wa.me/${CONTACTS.phoneHref.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center hover:scale-110 transition-all drop-shadow-sm"
              title="WhatsApp"
            >
              <WhatsAppIcon />
            </Link>
            <MaxContactLink
              className="flex items-center justify-center hover:scale-110 transition-all drop-shadow-sm"
              title="MAX"
            >
              <MaxIcon />
            </MaxContactLink>
          </div>
        </div>

        {/* Mobile row 2: marquee */}
        <div className="sm:hidden overflow-hidden border-t border-white/10 py-1.5">
          <div className="flex animate-marquee-fast whitespace-nowrap gap-6 text-[10px] font-bold text-white/70 tracking-tight will-change-transform">
            {[
              "📍 Москва шоурум",
              "🕒 09:00–20:00",
              "🛡 Работаем с 1997 года",
              "✅ 100% Оригинал",
              "⭐ 5.0 • 1000+ отзывов",
              "🚚 Быстрая доставка",
              "🏅 Гарантия 1 год",
              "🔧 Мы прошиваем консоли",
              "📍 Москва шоурум",
              "🕒 09:00–20:00",
              "🛡 Работаем с 1997 года",
              "✅ 100% Оригинал",
              "⭐ 5.0 • 1000+ отзывов",
              "🚚 Быстрая доставка",
              "🏅 Гарантия 1 год",
              "🔧 Мы прошиваем консоли",
              "📍 Москва шоурум",
              "🕒 09:00–20:00",
              "🛡 Работаем с 1997 года",
              "✅ 100% Оригинал",
              "⭐ 5.0 • 1000+ отзывов",
              "🚚 Быстрая доставка",
              "🏅 Гарантия 1 год",
              "🔧 Мы прошиваем консоли",
              "📍 Москва шоурум",
              "🕒 09:00–20:00",
              "🛡 Работаем с 1997 года",
              "✅ 100% Оригинал",
              "⭐ 5.0 • 1000+ отзывов",
              "🚚 Быстрая доставка",
              "🏅 Гарантия 1 год",
              "🔧 Мы прошиваем консоли",
            ].map((item, i) => (
              <span key={i} className="shrink-0">{item}</span>
            ))}
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-[auto_1fr_auto] items-center gap-3 h-10 border-b border-white/10">
          <Link 
            href="/about" 
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white border border-white/25 hover:border-white/50 hover:bg-white/10 transition-all active:scale-95 justify-self-start"
          >
            <Award size={13} className="shrink-0 text-white/80 group-hover:rotate-12 transition-transform" />
            <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight whitespace-nowrap">Почему нам доверяют</span>
          </Link>

          <div className="overflow-hidden justify-self-center w-full min-w-0">
            <div className="flex animate-marquee whitespace-nowrap gap-8 text-[12px] xl:text-[13px] font-bold text-white/80 tracking-tight">
              {[
                "📍 Москва шоурум",
                "🕒 09:00–20:00",
                "🛡 Работаем с 1997 года",
                "✅ 100% Оригинал",
                "⭐ 5.0 • 1000+ отзывов",
                "🚚 Быстрая доставка",
                "🏅 Гарантия 1 год",
                "🔧 Мы прошиваем консоли",
                "📍 Москва шоурум",
                "🕒 09:00–20:00",
                "🛡 Работаем с 1997 года",
                "✅ 100% Оригинал",
                "⭐ 5.0 • 1000+ отзывов",
                "🚚 Быстрая доставка",
                "🏅 Гарантия 1 год",
                "🔧 Мы прошиваем консоли",
              ].map((item, i) => (
                <span key={i} className="shrink-0">{item}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 justify-self-end shrink-0">
            <a
              href={CONTACTS.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center hover:scale-110 transition-all drop-shadow-sm"
              title="Telegram"
            >
              <TelegramIcon />
            </a>
            <Link
              href={`https://wa.me/${CONTACTS.phoneHref.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center hover:scale-110 transition-all drop-shadow-sm"
              title="WhatsApp"
            >
              <WhatsAppIcon />
            </Link>
            <MaxContactLink
              className="flex items-center justify-center hover:scale-110 transition-all drop-shadow-sm"
              title="MAX"
            >
              <MaxIcon />
            </MaxContactLink>
          </div>
        </div>


        <div className="hidden lg:flex items-center justify-between gap-2 sm:gap-4 h-10 relative">
          {/* Left: Showroom + Reviews */}
          <div className="flex items-center gap-2 sm:border-r sm:border-white/10 sm:pr-6 shrink-0">
            <a
              href={CONTACTS.yandexMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white border border-white/25 hover:border-white/50 hover:bg-white/10 transition-colors"
              title={CONTACTS.address}
            >
              <MapPin size={13} className="text-white shrink-0" />
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight whitespace-nowrap">Москва шоурум</span>
            </a>
            <Link
              href="/reviews"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white border border-white/25 hover:border-white/50 hover:bg-white/10 transition-colors"
            >
              <span className="animate-sparkle">⭐</span>
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight whitespace-nowrap">5.0 Отзывы</span>
            </Link>
          </div>

          {/* Center: Phone CTA */}
          <a
            href={`tel:${CONTACTS.phoneHref}`}
            className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 whitespace-nowrap text-white hover:text-white/80 transition-colors"
          >
            <span className="text-[12px] xl:text-[13px] font-normal uppercase tracking-tight text-white/70">Подобрать консоль</span>
            <span className="text-[18px] xl:text-[20px] font-black tracking-tight leading-none text-white">{CONTACTS.phoneDisplay}</span>
          </a>

          {/* Right: Action Buttons */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              href="/contacts#support-chat"
              className="flex items-center gap-1.5 rounded-full border border-primary bg-primary px-2.5 py-1 text-white transition-all hover:bg-primary-pressed active:scale-95"
            >
              <MessageCircle size={13} className="shrink-0" />
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight">Чат поддержки</span>
            </Link>
            <Link
              href="/delivery"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white border border-white/25 hover:bg-white/10 hover:border-white/50 transition-all active:scale-95"
            >
              <Truck size={13} className="shrink-0 text-white/80" />
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight">Доставка</span>
            </Link>
            <Link
              href="/gamepad-test"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white border border-white/25 hover:border-white/50 hover:bg-white/10 transition-all active:scale-95"
            >
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight">Тест геймпада</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
