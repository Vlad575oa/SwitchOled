import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { MaxContactLink } from "./MaxContactLink";
import { CONTACTS } from "@/lib/constants/contacts";
import { PWAInstallButton } from "./PWAInstallButton";

interface FooterProps {
    workingHours?: string;
    currentYear: number;
}

export const Footer = ({ workingHours = "09:00 — 21:00", currentYear }: FooterProps) => {
    return (
        <footer className="bg-[#2c2c30] text-white pt-12 pb-28 lg:pb-6 border-t border-white/[0.06] relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />

            <div className="w-full max-w-[1920px] mx-auto relative z-10 px-4 lg:px-6 2xl:px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">

                    {/* Brand */}
                    <div className="order-2 md:order-none flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-[0_6px_16px_var(--primary-glow)] transition-all group-hover:scale-105">
                                <span className="text-white font-black text-xl italic leading-none">G</span>
                            </div>
                            <span className="text-xl xl:text-2xl font-black tracking-tighter uppercase italic">
                                Gameshop<span className="text-primary">24</span>
                            </span>
                        </Link>
                        <p className="text-neutral-500 text-[12px] xl:text-[14px] font-medium leading-relaxed max-w-xs">
                            Премиальный магазин игровых консолей и аксессуаров. Только оригинальные товары с гарантией.
                        </p>
                        <div className="flex items-center gap-5">
                            <a href={CONTACTS.telegramUrl} target="_blank" rel="noopener noreferrer"
                                className="w-7 h-7 flex items-center justify-center transition-all hover:scale-110 drop-shadow-sm">
                                <img src="/icons/telegram-svgrepo-com.svg" alt="telegram" className="w-full h-full object-contain" />
                            </a>
                            <Link href={`https://wa.me/${CONTACTS.phoneHref.replace("+", "")}`} target="_blank" rel="noopener noreferrer"
                                className="w-7 h-7 flex items-center justify-center transition-all hover:scale-110 drop-shadow-sm">
                                <img src="/icons/whatsapp-svgrepo-com.svg" alt="wa" className="w-full h-full object-contain" />
                            </Link>
                            <MaxContactLink className="w-7 h-7 flex items-center justify-center transition-all hover:scale-110 drop-shadow-sm" title="MAX">
                                <img src="/icons/logotip-messendzhera-max.svg" alt="max" className="w-full h-full object-contain" />
                            </MaxContactLink>
                        </div>
                    </div>

                    {/* Nav */}
                    <div className="order-3 md:order-none">
                        <h4 className="text-[10px] xl:text-[12px] font-black uppercase tracking-[0.2em] text-primary mb-4">Каталог</h4>
                        <ul className="space-y-2">
                            {[
                                { name: "Nintendo Switch", href: "/catalog/nintendo" },
                                { name: "Nintendo Switch OLED", href: "/catalog/nintendo-switch-oled" },
                                { name: "Nintendo Switch Lite", href: "/catalog/nintendo-switch-lite" },
                                { name: "Все товары", href: "/catalog/all" },
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link href={item.href} className="text-[13px] xl:text-[14px] font-bold text-neutral-400 hover:text-white hover:translate-x-1 transition-all inline-block">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Info */}
                    <div className="order-4 md:order-none">
                        <h4 className="text-[10px] xl:text-[12px] font-black uppercase tracking-[0.2em] text-primary mb-4">Информация</h4>
                        <ul className="space-y-2">
                            {[
                                { name: "О компании", href: "/about" },
                                { name: "Блог", href: "/blog" },
                                { name: "Доставка и оплата", href: "/delivery" },
                                { name: "Гарантия", href: "/warranty" },
                                { name: "FAQ", href: "/faq" },
                                { name: "Тест геймпада", href: "/gamepad-test" },
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link href={item.href} className="text-[13px] xl:text-[14px] font-bold text-neutral-400 hover:text-white hover:translate-x-1 transition-all inline-block">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contacts */}
                    <div className="order-1 md:order-none">
                        <h4 className="text-[10px] xl:text-[12px] font-black uppercase tracking-[0.2em] text-primary mb-4">Контакты</h4>
                        <div className="space-y-3">
                            <Link href={`tel:${CONTACTS.phoneHref}`} className="flex items-center gap-3 group/item">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover/item:bg-primary/20 transition-colors">
                                    <Phone size={13} className="text-neutral-400 group-hover/item:text-primary transition-colors" />
                                </div>
                                <div>
                                    <p className="text-[16px] xl:text-[18px] font-black text-white">{CONTACTS.phoneDisplay}</p>
                                    <p className="text-[10px] xl:text-[11px] font-bold text-neutral-400 uppercase tracking-widest">{workingHours}</p>
                                </div>
                            </Link>
                            <Link href={`mailto:${CONTACTS.email}`} className="flex items-center gap-3 group/item">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover/item:bg-primary/20 transition-colors">
                                    <Mail size={13} className="text-neutral-400 group-hover/item:text-primary transition-colors" />
                                </div>
                                <div>
                                    <p className="text-[13px] xl:text-[14px] font-black text-white">{CONTACTS.email}</p>
                                    <p className="text-[10px] xl:text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Email</p>
                                </div>
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                    <MapPin size={13} className="text-neutral-400" />
                                </div>
                                <div>
                                    <p className="text-[13px] xl:text-[14px] font-black text-white">{CONTACTS.address}</p>
                                    <p className="text-[10px] xl:text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Шоурум</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-6 border-t border-white/5">
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
                            <Link key={link.name} href={link.href} className="text-[11px] xl:text-[12px] font-bold text-neutral-400 hover:text-neutral-200 transition-colors uppercase tracking-widest">
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] xl:text-[12px] font-black text-neutral-400 uppercase tracking-widest">
                            © {currentYear} Gameshop24
                        </p>
                        <PWAInstallButton />
                    </div>
                </div>
            </div>
        </footer>
    );
};
