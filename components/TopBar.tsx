import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, ShieldCheck, Award, Truck } from "lucide-react";
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
        <div className="sm:hidden relative flex items-center justify-between gap-3 py-2.5 min-h-[52px]">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] shrink-0">
            <Clock size={14} className="text-secondary shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-tight text-black whitespace-nowrap">
              {compactWorkingHours}
            </span>
          </div>

          <a
            href={`tel:${CONTACTS.phoneHref}`}
            className="absolute left-1/2 -translate-x-1/2 inline-flex items-center mx-1 px-2 py-2 rounded-full border border-primary/25 text-black hover:text-neutral-700 hover:border-primary/40 transition-colors"
          >
            <span className="text-[16px] font-black tracking-tight leading-none whitespace-nowrap">{CONTACTS.phoneDisplay}</span>
          </a>
          <div className="flex items-center gap-2 shrink-0">
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

        <div className="hidden sm:grid grid-cols-[auto_1fr_auto] items-center gap-3 h-10 border-b border-[var(--bg-elevated)]">
          <Link 
            href="/about" 
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 hover:border-emerald-400 hover:bg-emerald-100 transition-all active:scale-95 justify-self-start"
          >
            <Award size={13} className="shrink-0 text-emerald-600 group-hover:rotate-12 transition-transform" />
            <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight whitespace-nowrap">Почему нам доверяют</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 justify-self-center shrink-0 lg:-translate-x-[50px]">
            <a
              href={`tel:${CONTACTS.phoneHref}`}
              className="inline-flex items-center gap-2 px-0 py-0 text-black hover:text-neutral-700 transition-colors shrink-0"
            >
              <span className="text-[12px] xl:text-[13px] font-normal uppercase tracking-tight text-black/70">Подобрать консоль</span>
              <span className="text-[13px] xl:text-[15px] font-bold tracking-tight whitespace-nowrap leading-none text-black">{CONTACTS.phoneDisplay}</span>
            </a>
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

        <div className="lg:hidden flex flex-col gap-2 py-2.5 px-1 border-t border-[var(--bg-elevated)]">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 shrink-0 text-black">
              <ShieldCheck size={12} className="shrink-0 text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">С 1997 года</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-black">
              <ShieldCheck size={12} className="shrink-0 text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">100% Оригинал</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-black">
              <Award size={12} className="shrink-0 text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">1 год гарантии</span>
            </div>
            <Link
              href="/delivery"
              className="flex items-center justify-center w-7 h-7 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 shrink-0"
              aria-label="Быстрая доставка"
            >
              <Truck size={12} className="shrink-0" />
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-between gap-2 sm:gap-4 h-10 relative">
          {/* Left: Location & Time */}
          <div className="flex items-center gap-3 sm:gap-4 sm:border-r sm:border-[var(--bg-elevated)] sm:pr-6 shrink-0">
            <a
              href={CONTACTS.yandexMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-black border border-black/20 hover:border-black/35 hover:bg-black/[0.03] transition-colors"
              title={CONTACTS.address}
            >
              <MapPin size={13} className="text-secondary shrink-0 hover:text-primary transition-colors" />
              <span className="text-[11px] xl:text-[12px] font-bold uppercase tracking-tight hidden sm:inline">Москва</span>
              <span className="text-[11px] xl:text-[12px] font-bold uppercase tracking-tight hidden sm:inline">Шоурум</span>
            </a>
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Clock size={13} className="text-secondary shrink-0" />
              <span className="text-[11px] xl:text-[12px] font-black uppercase tracking-wider">{workingHours}</span>
            </div>
          </div>

          {/* Center: Trust Badges */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-5 xl:gap-8 whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-black shrink-0 leading-none">
              <ShieldCheck size={13} className="shrink-0 text-emerald-600" />
              <span className="flex flex-col -mt-px">
                <span className="text-[12px] xl:text-[13px] font-normal uppercase tracking-tight text-black/80">С</span>
                <span className="text-[12px] xl:text-[13px] font-normal tracking-tight text-black">
                  <span className="font-bold">1997</span> года
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-black">
              <ShieldCheck size={13} className="shrink-0 text-emerald-600" />
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight whitespace-nowrap">100% Оригинал</span>
            </div>
            <div className="flex items-center gap-1.5 text-black">
              <Award size={13} className="shrink-0 text-emerald-600" />
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight">Гарантия 1 год</span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              href="/delivery"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 transition-all active:scale-95"
            >
              <Truck size={13} className="shrink-0 text-emerald-600" />
              <span className="text-[12px] xl:text-[13px] font-bold uppercase tracking-tight text-emerald-800">Быстрая доставка</span>
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
