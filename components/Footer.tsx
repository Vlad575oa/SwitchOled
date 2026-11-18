import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CONTACTS } from "@/lib/constants/contacts";
import { PWAInstallButton } from "./PWAInstallButton";

interface FooterProps {
    workingHours?: string;
    currentYear: number;
}

const COLUMNS = [
    {
        title: "Каталог",
        links: [
            { name: "Nintendo Switch", href: "/catalog/nintendo" },
            { name: "Switch OLED", href: "/catalog/nintendo-switch-oled" },
            { name: "Switch Lite", href: "/catalog/nintendo-switch-lite" },
            { name: "Игры", href: "/catalog/games" },
            { name: "Все товары", href: "/catalog/all" },
        ],
    },
    {
        title: "Покупателям",
        links: [
            { name: "Доставка и оплата", href: "/delivery" },
            { name: "Гарантия", href: "/warranty" },
            { name: "FAQ", href: "/faq" },
            { name: "Сервисный центр", href: "/service" },
            { name: "Тест геймпада", href: "/gamepad-test" },
        ],
    },
    {
        title: "Компания",
        links: [
            { name: "О компании", href: "/about" },
            { name: "Блог", href: "/blog" },
            { name: "Отзывы", href: "/reviews" },
            { name: "Контакты", href: "/contacts" },
        ],
    },
];

const LEGAL = [
    { name: "Публичная оферта", href: "/legal/offer" },
    { name: "Конфиденциальность", href: "/legal/privacy" },
    { name: "Условия использования", href: "/legal/terms" },
    { name: "Файлы cookie", href: "/legal/cookies" },
    { name: "Политика", href: "/policy" },
    { name: "Согласие на обработку ПД", href: "/legal/personal-data" },
];

export const Footer = ({ workingHours = "09:00 — 21:00", currentYear }: FooterProps) => {
    return (
        <footer className="px-3 pb-28 lg:pb-3 pt-3">
            <div className="rounded-3xl bg-[#0f0f10] text-white px-8 sm:px-12 lg:px-20 py-14 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-14 lg:gap-24">
                    {/* Brand: last on mobile, first on desktop */}
                    <div className="order-2 lg:order-1 flex flex-col">
                        <Link href="/" className="flex items-center gap-2 self-start">
                            <span className="w-[18px] h-[18px] rounded-full border-[4.5px] border-white" />
                            <span className="text-[18px] font-semibold tracking-[-0.01em]">Gameshop24</span>
                        </Link>
                        <p className="mt-4 max-w-[380px] text-[15px] leading-[1.55] text-white/55">
                            Прошитые Nintendo Switch с гарантией. Настраиваем, устанавливаем игры и обслуживаем консоли в Москве с 1997 года.
                        </p>
                        <div className="mt-6 space-y-1 text-[15px] text-white/55">
                            <a href={`tel:${CONTACTS.phoneHref}`} className="block text-white hover:text-white/70 transition-colors">{CONTACTS.phoneDisplay}</a>
                            <a href={`mailto:${CONTACTS.email}`} className="block hover:text-white transition-colors">{CONTACTS.email}</a>
                            <p>{CONTACTS.address} · {workingHours}</p>
                        </div>

                        <div className="mt-10 lg:mt-auto lg:pt-16">
                            <Link
                                href="/contacts#support-chat"
                                className="inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-white text-black text-[15px] font-medium hover:bg-white/85 transition-colors"
                            >
                                Написать в чат <ArrowUpRight size={16} />
                            </Link>
                            <p className="mt-4 text-[15px] text-white/80">© {currentYear} Gameshop24</p>
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                                {LEGAL.map((l) => (
                                    <Link key={l.href} href={l.href} className="text-[12px] text-white/40 hover:text-white/70 transition-colors">
                                        {l.name}
                                    </Link>
                                ))}
                            </div>
                            <div className="mt-4">
                                <PWAInstallButton />
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-16 lg:gap-20">
                        {COLUMNS.map((col) => (
                            <div key={col.title}>
                                <p className="text-[18px] font-medium">{col.title}</p>
                                <ul className="mt-6 space-y-3.5">
                                    {col.links.map((l) => (
                                        <li key={l.href}>
                                            <Link href={l.href} className="text-[15px] text-white/55 hover:text-white transition-colors whitespace-nowrap">
                                                {l.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};
