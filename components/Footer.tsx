import Link from "next/link";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { MaxContactLink } from "./MaxContactLink";
import { CONTACTS } from "@/lib/constants/contacts";
import { PWAInstallButton } from "./PWAInstallButton";

interface FooterProps {
    workingHours?: string;
    currentYear: number;
}

export const Footer = ({ workingHours = "09:00 — 21:00", currentYear }: FooterProps) => {
    return (
        <footer className="bg-primary text-white pt-12 pb-28 lg:pb-6 relative overflow-hidden">

            <div className="w-full max-w-[1920px] mx-auto relative z-10 px-4 lg:px-6 2xl:px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">

                    {/* Brand */}
                    <div className="order-2 md:order-none flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center transition-all group-hover:scale-105">
                                <span className="text-primary font-bold text-xl leading-none">G</span>
                            </div>
                            <span className="font-display text-2xl xl:text-3xl font-light tracking-[0.02em]">
                                Gameshop24
                            </span>
                        </Link>
                        <p className="text-white/80 text-[13px] xl:text-[14px] leading-relaxed max-w-xs">
                            Премиальный магазин игровых консолей и аксессуаров. Только оригинальные товары с гарантией.
                        </p>
                        <div className="flex items-center gap-5">
                            <a href={CONTACTS.telegramUrl} target="_blank" rel="noopener noreferrer"
                                className="w-7 h-7 flex items-center justify-center transition-all hover:scale-110 drop-shadow-sm">
                                <img src="/icons/telegram-svgrepo-com.svg" alt="telegram" className="w-full h-full object-contain" />
                            </a>
                            <Link href={`https://wa.me/${CONTACTS.phoneHref.replace("+", "")}`} target="_blank" rel="noopener noreferrer"
                                className="w-7 h-7 flex items-center justify-center transition-all hover:scale-110 drop-shadow-sm">
                                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/12 px-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                                    WA
                                </span>
                            </Link>
                            <MaxContactLink className="w-7 h-7 flex items-center justify-center transition-all hover:scale-110 drop-shadow-sm" title="MAX">
                                <img src="/icons/logotip-messendzhera-max.svg" alt="max" className="w-full h-full object-contain" />
                            </MaxContactLink>
                        </div>
                    </div>

                    {/* Nav */}
                    <div className="order-3 md:order-none">
                        <h4 className="text-[10px] xl:text-[12px] font-semibold uppercase tracking-[0.2em] text-white mb-4">Каталог</h4>
                        <ul className="space-y-2">
                            {[
                                { name: "Nintendo Switch", href: "/catalog/nintendo" },
                                { name: "Nintendo Switch OLED", href: "/catalog/nintendo-switch-oled" },
                                { name: "Nintendo Switch Lite", href: "/catalog/nintendo-switch-lite" },
                                { name: "Игры", href: "/catalog/games" },
                                { name: "Все товары", href: "/catalog/all" },
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link href={item.href} className="text-[13px] xl:text-[14px] text-white/80 hover:text-white hover:underline transition-all inline-block">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Info */}
                    <div className="order-4 md:order-none">
                        <h4 className="text-[10px] xl:text-[12px] font-semibold uppercase tracking-[0.2em] text-white mb-4">Информация</h4>
                        <ul className="space-y-2">
                            {[
                                { name: "О компании", href: "/about" },
                                { name: "Блог", href: "/blog" },
                                { name: "Доставка и оплата", href: "/delivery" },
                                { name: "Гарантия", href: "/warranty" },
                                { name: "FAQ", href: "/faq" },
                                { name: "🎮 Тест геймпада", href: "/gamepad-test" },
                                { name: "🔧 Сервисный центр", href: "/service" },
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link href={item.href} className="text-[13px] xl:text-[14px] text-white/80 hover:text-white hover:underline transition-all inline-block">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contacts */}
                    <div className="order-1 md:order-none">
                        <h4 className="text-[10px] xl:text-[12px] font-semibold uppercase tracking-[0.2em] text-white mb-4">Контакты</h4>
                        <div className="space-y-3">
                            <Link href={`tel:${CONTACTS.phoneHref}`} className="flex items-center gap-3 group/item">
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 group-hover/item:bg-white/25 transition-colors">
                                    <Phone size={13} className="text-white group-hover/item:text-white transition-colors" />
                                </div>
                                <div>
                                    <p className="text-[16px] xl:text-[18px] font-black text-white">{CONTACTS.phoneDisplay}</p>
                                    <p className="text-[10px] xl:text-[11px] text-white/70 uppercase tracking-widest">{workingHours}</p>
                                </div>
                            </Link>
                            <Link href={`mailto:${CONTACTS.email}`} className="flex items-center gap-3 group/item">
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 group-hover/item:bg-white/25 transition-colors">
                                    <Mail size={13} className="text-white group-hover/item:text-white transition-colors" />
                                </div>
                                <div>
                                    <p className="text-[13px] xl:text-[14px] font-black text-white">{CONTACTS.email}</p>
                                    <p className="text-[10px] xl:text-[11px] text-white/70 uppercase tracking-widest">Email</p>
                                </div>
                            </Link>
                            <Link href="/contacts#support-chat" className="flex items-center gap-3 group/item">
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 group-hover/item:bg-white/25 transition-colors">
                                    <MessageCircle size={13} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[13px] xl:text-[14px] font-black text-white group-hover/item:underline transition-colors">Чат с поддержкой</p>
                                    <p className="text-[10px] xl:text-[11px] text-white/70 uppercase tracking-widest">Заказ или вопрос</p>
                                </div>
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                                    <MapPin size={13} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[13px] xl:text-[14px] font-black text-white">{CONTACTS.address}</p>
                                    <p className="text-[10px] xl:text-[11px] text-white/70 uppercase tracking-widest">Шоурум</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-6 border-t border-white/20">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                        {[
                            { name: "Публичная оферта", href: "/legal/offer" },
                            { name: "Конфиденциальность", href: "/legal/privacy" },
                            { name: "Условия использования", href: "/legal/terms" },
                            { name: "Файлы Cookie", href: "/legal/cookies" },
                            { name: "Политика", href: "/policy" },
                            { name: "Согласие на обработку ПД", href: "/legal/personal-data" },
                            { name: "Контакты", href: "/contacts" },
                        ].map((link) => (
                            <Link key={link.name} href={link.href} className="text-[11px] xl:text-[12px] text-white/80 hover:text-white transition-colors uppercase tracking-widest">
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] xl:text-[12px] font-medium text-white/80 uppercase tracking-widest">
                            © {currentYear} Gameshop24
                        </p>
                        <PWAInstallButton />
                    </div>
                </div>
            </div>
        </footer>
    );
};
