import Link from "next/link";
import { MapPin, Clock, ShieldCheck, Award } from "lucide-react";
import { MaxContactLink } from "./MaxContactLink";
import { CONTACTS } from "@/lib/constants/contacts";

const MaxIcon = () => (
  <img src="/icons/logotip-messendzhera-max.svg" alt="MAX" className="w-full h-full object-contain overflow-hidden rounded-full" />
);

const WhatsAppIcon = () => (
  <img src="/icons/whatsapp-svgrepo-com.svg" alt="WhatsApp" className="w-full h-full object-contain" />
);

const TelegramIcon = () => (
  <img src="/icons/telegram-svgrepo-com.svg" alt="Telegram" className="w-full h-full object-contain" />
);


export const TopBar = ({ workingHours = "09:00 — 21:00" }: { workingHours?: string }) => {
  return (
    <div className="bg-[var(--bg-surface)] border-b border-[var(--bg-elevated)] transition-colors">
      <div className="container px-4 h-10 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Location, Time & Trust Badges */}
        <div className="flex items-center gap-3 sm:gap-6 overflow-hidden">
          <div className="flex items-center gap-3 sm:gap-4 sm:border-r sm:border-[var(--bg-elevated)] sm:pr-6 shrink-0">
            <a
              href={CONTACTS.yandexMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-primary transition-colors"
              title={CONTACTS.address}
            >
              <MapPin size={13} className="text-secondary shrink-0 hover:text-primary transition-colors" />
              <span className="text-[11px] font-black uppercase tracking-wider hidden sm:inline">Москва</span>
            </a>
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Clock size={13} className="text-secondary shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-wider">{workingHours}</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-5">
            <Link 
              href="/about" 
              className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all active:scale-95"
            >
              <Award size={12} className="shrink-0 group-hover:rotate-12 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-tight">Почему мы</span>
            </Link>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50/50 text-blue-600 border border-blue-100/50">
              <ShieldCheck size={12} className="shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-tight">100% Оригинал</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50/50 text-purple-600 border border-purple-100/50">
              <Award size={12} className="shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-tight">Гарантия 1 год</span>
            </div>
            <Link
              href="/delivery"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50/60 text-emerald-700 border border-emerald-100/70 hover:bg-emerald-100/70 transition-all active:scale-95"
            >
              <span className="text-[9px] font-black uppercase tracking-tight">Доставка</span>
            </Link>
            <Link
              href="/gamepad-test"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-50/60 text-violet-700 border border-violet-100/70 hover:bg-violet-100/70 transition-all active:scale-95"
            >
              <span className="text-[9px] font-black uppercase tracking-tight">Тест геймпада</span>
            </Link>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <a
            href={`tel:${CONTACTS.phoneHref}`}
            className="text-[14px] font-black text-[var(--text-primary)] hover:text-primary transition-colors tracking-widest uppercase hidden sm:inline"
          >
            {CONTACTS.phoneDisplay}
          </a>
          {/* Mobile: phone icon link */}
          <a href={`tel:${CONTACTS.phoneHref}`} className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary" aria-label="Позвонить">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.7A2 2 0 012 .86h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          </a>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href={CONTACTS.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center hover:scale-110 transition-all drop-shadow-sm"
              title="Telegram"
            >
              <TelegramIcon />
            </a>
            <Link
              href={`https://wa.me/${CONTACTS.phoneHref.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center hover:scale-110 transition-all drop-shadow-sm"
              title="WhatsApp"
            >
              <WhatsAppIcon />
            </Link>
            <MaxContactLink
              className="w-[26px] h-[26px] flex items-center justify-center hover:scale-110 transition-all drop-shadow-sm"
              title="MAX"
            >
              <MaxIcon />
            </MaxContactLink>
          </div>
        </div>
      </div>
    </div>
  );
};
