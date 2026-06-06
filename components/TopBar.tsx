import Link from "next/link";
import Image from "next/image";
import { MapPin, ShieldCheck, Award, Truck } from "lucide-react";
import { MaxContactLink } from "./MaxContactLink";
import { CONTACTS } from "@/lib/constants/contacts";

const MaxIcon = () => (
  <Image src="/icons/logotip-messendzhera-max.svg" alt="MAX" width={26} height={26} className="object-contain rounded-full" />
);

const WhatsAppIcon = () => (
  <Image src="/icons/whatsapp-svgrepo-com.svg" alt="WhatsApp" width={26} height={26} className="object-contain" />
);

const TelegramIcon = () => (
  <Image src="/icons/telegram-svgrepo-com.svg" alt="Telegram" width={26} height={26} className="object-contain" />
);


export const TopBar = ({ workingHours = "09:00 — 21:00" }: { workingHours?: string }) => {
  const compactWorkingHours = workingHours
    .replace(/:00/g, "")
    .replace(/\s*—\s*/g, "-");

  return (
    <div className="sticky top-0 left-0 right-0 z-[60] bg-[var(--bg-surface)] border-b border-[var(--bg-elevated)] transition-colors">
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:pl-6 lg:pr-4 2xl:pl-4 2xl:pr-4">
        {/* Mobile row 1: truck + phone + rating + messengers */}
        <div className="sm:hidden relative flex items-center justify-between gap-2 py-2 min-h-[48px]">
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/reviews"
              className="flex items-center gap-1 px-2 py-1 rounded-full border border-black/20 text-black text-[10px] font-black whitespace-nowrap"
            >
              <span className="animate-sparkle">⭐</span> 5.0
            </Link>
            <Link
              href="/delivery"
              className="flex items-center justify-center w-6 h-6 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 shrink-0"
              aria-label="Быстрая доставка"
            >
              <Truck size={11} className="shrink-0" />
            </Link>
          </div>

          <a
            href={`tel:${CONTACTS.phoneHref}`}
            className="absolute left-1/2 -translate-x-1/2 inline-flex items-center px-2 py-1.5 rounded-full border border-primary/25 text-black hover:text-neutral-700 hover:border-primary/40 transition-colors"
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
        <div className="sm:hidden overflow-hidden border-t border-[var(--bg-elevated)] py-1.5">
          <div className="flex animate-marquee-fast whitespace-nowrap gap-6 text-[10px] font-bold text-black/70 tracking-tight">
            {[
              "📍 Москва шоурум",
              "🕒 09:00–20:00",
              "🛡 С 1997 года",
              "✅ 100% Оригинал",
              "🚚 Доставка от 500₽",
              "🏅 Гарантия 1 год",
              "🔧 Прошиваем консоли",
              "📍 Москва шоурум",
              "🕒 09:00–20:00",
              "🛡 С 1997 года",
              "✅ 100% Оригинал",
              "🚚 Доставка от 500₽",
              "🏅 Гарантия 1 год",
              "🔧 Прошиваем консоли",
            ].map((item, i) => (
              <span key={i} className="shrink-0">{item}</span>
            ))}
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-[auto_1fr_auto] items-center gap-3 h-10 border-b border-[var(--bg-elevated)]">
          <Link 
            href="/about" 
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 hover:border-emerald-400 hover:bg-emerald-100 transition-all active:scale-95 justify-self-start"
          >
            <Award size={13} className="shrink-0 text-emerald-600 group-hover:rotate-12 transition-transform" />
            <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight whitespace-nowrap">Почему нам доверяют</span>
          </Link>

          <div className="overflow-hidden justify-self-center w-full min-w-0">
            <div className="flex animate-marquee whitespace-nowrap gap-8 text-[12px] xl:text-[13px] font-bold text-black/80 tracking-tight">
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
          <div className="flex items-center gap-2 sm:border-r sm:border-[var(--bg-elevated)] sm:pr-6 shrink-0">
            <a
              href={CONTACTS.yandexMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-black border border-black/20 hover:border-black/35 hover:bg-black/[0.03] transition-colors"
              title={CONTACTS.address}
            >
              <MapPin size={13} className="text-secondary shrink-0" />
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight whitespace-nowrap">Москва шоурум</span>
            </a>
            <Link
              href="/reviews"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-black border border-black/20 hover:border-black/35 hover:bg-black/[0.03] transition-colors"
            >
              <span className="animate-sparkle">⭐</span>
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight whitespace-nowrap">5.0 Отзывы</span>
            </Link>
          </div>

          {/* Center: Phone CTA */}
          <a
            href={`tel:${CONTACTS.phoneHref}`}
            className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 whitespace-nowrap text-black hover:text-neutral-700 transition-colors"
          >
            <span className="text-[12px] xl:text-[13px] font-normal uppercase tracking-tight text-black/70">Подобрать консоль</span>
            <span className="text-[18px] xl:text-[20px] font-black tracking-tight leading-none text-black">{CONTACTS.phoneDisplay}</span>
          </a>

          {/* Right: Action Buttons */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              href="/delivery"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 transition-all active:scale-95"
            >
              <Truck size={13} className="shrink-0 text-emerald-600" />
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight text-emerald-800">Доставка</span>
            </Link>
            <Link
              href="/gamepad-test"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-black border border-black/30 hover:border-black/45 hover:bg-black/[0.03] transition-all active:scale-95"
            >
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight">Тест геймпада</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
