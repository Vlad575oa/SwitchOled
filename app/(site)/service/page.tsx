import { Metadata } from "next";
import Link from "next/link";
import { CONTACTS } from "@/lib/constants/contacts";
import { CheckCircle, Wrench, Truck, Clock, ShieldCheck, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Сервисный центр Nintendo Switch в Москве | GameShop24",
  description: "Специализированный сервисный центр по ремонту Nintendo Switch в Москве. Switch V1/V2, Lite, OLED, Joy-Con. Гарантия до 1 года. Большинство работ за 1–3 часа.",
  alternates: { canonical: "/service" },
};

const mainServices = [
  { name: "Прошивка Nintendo Switch", price: "4 500 ₽", note: "V1, V2, Lite, OLED" },
  { name: "Прошивка + карта памяти 128 ГБ", price: "от 6 500 ₽", note: "с играми в комплекте" },
  { name: "Прошивка + карта памяти 256 ГБ", price: "от 8 500 ₽", note: "с играми в комплекте" },
  { name: "Ремонт и диагностика", price: "от 1 500 ₽", note: "зависит от сложности" },
];

const repairs = [
  "Ремонт после неудачной прошивки",
  "Ремонт после других сервисов",
  "Замена микросхем и компонентный ремонт",
  "Не включается / нет изображения / не заряжается",
  "Ремонт Joy-Con и геймпадов",
  "Чистка и обслуживание консоли",
  "Ремонт практически любых неисправностей Nintendo Switch",
  "Восстановление после «Kamikaze»",
  "Восстановление дорожек DAT0",
];

const models = [
  "Nintendo Switch V1 / V2",
  "Nintendo Switch Lite",
  "Nintendo Switch OLED",
  "Joy-Con и геймпады Nintendo",
];

const advantages = [
  { icon: Star, text: "Большой опыт именно с Nintendo Switch" },
  { icon: ShieldCheck, text: "Гарантия на работу до 1 года" },
  { icon: CheckCircle, text: "Помощь и поддержка после настройки" },
  { icon: Clock, text: "Большинство работ выполняем за 1–3 часа" },
];

export default function ServicePage() {
  return (
    <div className="bg-white min-h-screen pb-24">

      {/* Hero */}
      <div className="bg-[#111827] text-white py-14 px-4">
        <div className="container max-w-4xl">
          <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Сервисный центр</p>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            Специализированный сервисный центр<br className="hidden sm:block" /> по Nintendo Switch в Москве 👌
          </h1>
          <p className="text-neutral-300 font-medium leading-relaxed max-w-2xl mb-6">
            Работаем с консолями Nintendo каждый день и отлично знаем все нюансы Switch V1/V2, Lite и OLED.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`tel:${CONTACTS.phoneHref}`}
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-colors"
            >
              Позвонить: {CONTACTS.phoneDisplay}
            </a>
            <a
              href={CONTACTS.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-2xl font-black text-sm hover:bg-white/20 transition-colors"
            >
              Написать в Telegram
            </a>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl py-12 px-4 space-y-12">

        {/* Delivery */}
        <div className="flex items-start gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <Truck size={22} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-emerald-900 text-base">Своя курьерская доставка!</p>
            <p className="text-emerald-800 font-medium text-sm mt-0.5">По Москве и МО от 500 ₽</p>
          </div>
        </div>

        {/* Main services & prices */}
        <div>
          <h2 className="text-xl font-black text-secondary uppercase tracking-tight mb-5">💰 Основные услуги и цены:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mainServices.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3 bg-white border border-neutral-100 rounded-2xl px-4 py-4 shadow-sm">
                <div>
                  <p className="font-black text-secondary text-sm leading-snug">{s.name}</p>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">{s.note}</p>
                </div>
                <span className="text-primary font-black text-base whitespace-nowrap shrink-0">{s.price}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-400 font-medium mt-3">
            Точная стоимость уточняется у менеджера — позвоните или напишите в Telegram.
          </p>
        </div>

        {/* Models */}
        <div>
          <h2 className="text-xl font-black text-secondary uppercase tracking-tight mb-5">🎮 Работаем с:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {models.map((model) => (
              <div key={model} className="flex items-center gap-3 bg-neutral-50 rounded-2xl px-4 py-3 border border-neutral-100">
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                <span className="font-bold text-secondary text-sm">{model}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Repairs */}
        <div>
          <h2 className="text-xl font-black text-secondary uppercase tracking-tight mb-5">🔧 Выполняем:</h2>
          <div className="space-y-2.5">
            {repairs.map((item) => (
              <div key={item} className="flex items-start gap-3 py-2.5 border-b border-neutral-100 last:border-0">
                <Wrench size={15} className="text-primary shrink-0 mt-0.5" />
                <span className="font-medium text-secondary text-sm leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment note */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
          <p className="text-secondary font-medium leading-relaxed text-sm">
            🧰 Работаем на профессиональном оборудовании, аккуратно и без «гаражного колхоза» 😄
            У нас свой сервисный центр, а Nintendo Switch — одно из основных направлений работы.
          </p>
        </div>

        {/* Advantages */}
        <div>
          <h2 className="text-xl font-black text-secondary uppercase tracking-tight mb-5">✅ Почему мы:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {advantages.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm">
                <Icon size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="font-bold text-secondary text-sm leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#111827] rounded-3xl p-8 text-center text-white">
          <p className="text-lg font-black mb-2">Нужен ремонт Nintendo Switch?</p>
          <p className="text-neutral-400 text-sm font-medium mb-6">Звоните или пишите — расскажем, поможем, починим.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={`tel:${CONTACTS.phoneHref}`}
              className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-colors"
            >
              {CONTACTS.phoneDisplay}
            </a>
            <Link
              href="/delivery"
              className="px-6 py-3 bg-white/10 text-white rounded-2xl font-black text-sm hover:bg-white/20 transition-colors"
            >
              Доставка и оплата
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
