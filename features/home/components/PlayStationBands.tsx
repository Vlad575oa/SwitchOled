import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Gamepad2, CalendarCheck } from "lucide-react";
import { CONTACTS } from "@/lib/constants/contacts";

// Full-bleed chapter bands in the PlayStation style (design-md/design-md/playstation/DESIGN.md):
// dark hero → light console showcase → (catalog) → dark "why us" band → blue footer.

export function HeroBand() {
  return (
    <section className="relative w-full bg-black text-white overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
        <Image
          src="/images/blog/nintendo-switch-chipped-guide.webp"
          alt="Nintendo Switch OLED"
          fill
          priority
          sizes="(min-width: 1024px) 64vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent lg:via-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent lg:hidden" />
      </div>

      <div className="relative w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-16 sm:py-20 lg:py-24 min-h-[460px] lg:min-h-[560px] flex flex-col justify-end lg:justify-center">
        <p className="text-[14px] font-medium uppercase tracking-[0.2em] text-[#cccccc] mb-4">Nintendo Switch OLED</p>
        <h1 className="font-display font-light text-[32px] sm:text-[44px] lg:text-[54px] leading-[1.25] tracking-[-0.1px] max-w-[620px]">
          Прошитые Nintendo Switch — купить в Москве с гарантией
        </h1>
        <p className="mt-5 text-[16px] sm:text-[18px] leading-[1.5] text-white/70 max-w-[520px]">
          OLED и Lite с гарантией 1 год. 100+ игр в комплекте, доставка в день заказа по Москве.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#catalog"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary text-white text-[16px] sm:text-[18px] font-bold tracking-[0.45px] hover:bg-primary-pressed transition-colors"
          >
            Смотреть каталог
          </a>
          <a
            href={`tel:${CONTACTS.phoneHref}`}
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full border border-white/40 text-white text-[16px] sm:text-[18px] font-bold tracking-[0.45px] hover:border-white transition-colors"
          >
            Подобрать консоль
          </a>
        </div>
      </div>
    </section>
  );
}

const SHOWCASE = [
  { name: "OLED White", image: "/images/products/nintendo/nintendo-switch-oled-64gb-white/1.webp" },
  { name: "OLED Neon", image: "/images/products/nintendo/nintendo-switch-oled-64gb-neon/1.webp" },
  { name: "Splatoon 3 Edition", image: "/images/products/nintendo/nintendo-switch-oled-64gb-splatoon-3-edition/1.webp" },
  { name: "Zelda Edition", image: "/images/products/nintendo/nintendo-switch-oled-zelda-bundle/1.webp" },
  { name: "OLED + Mario", image: "/images/products/nintendo/nintendo-switch-oled-white-mario/1.webp" },
];

export function ShowcaseBand() {
  return (
    <section className="w-full bg-white text-black">
      <div className="w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-12 sm:py-16 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-12">
          <div>
            <h2 className="font-display font-light text-[28px] sm:text-[35px] lg:text-[44px] leading-[1.25] tracking-[0.1px]">
              Выберите свою Switch OLED
            </h2>
            <p className="mt-2 text-[16px] sm:text-[18px] leading-[1.5] text-black/60">
              Все версии прошиты, настроены и проверены перед отправкой.
            </p>
          </div>
          <Link
            href="/catalog/nintendo-switch-oled"
            className="inline-flex items-center gap-2 self-start sm:self-auto h-12 px-7 rounded-full border border-[#cccccc] text-[16px] font-bold tracking-[0.45px] hover:border-black transition-colors"
          >
            Все модели <ArrowRight size={18} />
          </Link>
        </div>

        <div className="flex lg:grid lg:grid-cols-5 gap-4 lg:gap-6 overflow-x-auto no-scrollbar -mx-6 px-6 scroll-px-6 lg:mx-0 lg:px-0 lg:scroll-px-0 snap-x">
          {SHOWCASE.map((item) => (
            <Link
              key={item.name}
              href="/catalog/nintendo-switch-oled"
              className="group shrink-0 w-[62%] sm:w-[40%] lg:w-auto snap-start"
            >
              <div className="relative aspect-square rounded-lg bg-surface-card overflow-hidden">
                <Image
                  src={item.image}
                  alt={`Nintendo Switch ${item.name}`}
                  fill
                  sizes="(min-width: 1024px) 20vw, 60vw"
                  className="object-contain p-4 mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </div>
              <p className="mt-3 text-[16px] font-semibold leading-tight">{item.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const REASONS = [
  { icon: ShieldCheck, title: "Гарантия 1 год", text: "На консоль и выполненные работы. Сервисный центр в Москве." },
  { icon: CalendarCheck, title: "Работаем с 1997 года", text: "Более 1000 отзывов с оценкой 5.0 и 100+ довольных клиентов каждый месяц." },
  { icon: Truck, title: "Доставка в день заказа", text: "Курьером по Москве или самовывоз из шоурума." },
  { icon: Gamepad2, title: "100+ игр в комплекте", text: "Установим любые игры, подскажем и подготовим консоль." },
];

export function WhyBand() {
  return (
    <section className="w-full bg-gradient-to-b from-ink-deep to-black text-white">
      <div className="w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-12 sm:py-16 lg:py-24">
        <h2 className="font-display font-light text-[28px] sm:text-[35px] lg:text-[44px] leading-[1.25] tracking-[0.1px] mb-8 lg:mb-12">
          Почему Gameshop24
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {REASONS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-lg bg-ink-elevated p-6">
              <Icon size={28} strokeWidth={1.5} className="text-[#53b1ff]" />
              <p className="mt-5 font-display font-light text-[22px] leading-[1.25]">{title}</p>
              <p className="mt-2 text-[16px] leading-[1.5] text-white/70">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
