import { Metadata } from "next";
import Image from "next/image";
import { ShieldCheck, Gamepad2, MapPin, Banknote } from "lucide-react";
import { getPageContent } from "@/lib/getPageContent";
import { CONTACTS } from "@/lib/constants/contacts";
import { InfoPageShell, InfoHero, Section, FactGrid, HelpBand, PillLink } from "@/components/info/InfoKit";
import { Accordion } from "@/components/info/Accordion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "О компании Switch OLED — прошитые консоли с гарантией" },
  description: "Switch OLED — магазин прошитых Nintendo Switch в Москве. Больше 20 лет опыта, 5000+ прошитых консолей, гарантия 1 год.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const d = await getPageContent("about");

  const stats = [
    { value: d.stat1_value ?? "20+", label: d.stat1_label ?? "лет опыта" },
    { value: d.stat2_value ?? "5000+", label: d.stat2_label ?? "прошитых консолей" },
    { value: d.stat3_value ?? "5.0", label: d.stat3_label ?? "рейтинг на Авито" },
  ];

  return (
    <InfoPageShell>
      <InfoHero
        eyebrow={d.hero_label ?? "О компании"}
        title={
          <>
            {d.hero_title ?? "Прошиваем Nintendo Switch"} {d.hero_subtitle ?? "больше 20 лет"}
          </>
        }
        lead={d.hero_text1 ?? "Мы продаём только прошитые Switch: настраиваем, устанавливаем игры и помогаем после покупки."}
      />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="relative min-h-[320px] lg:min-h-[480px] rounded-3xl overflow-hidden bg-neutral-900">
          <Image src="/about_hero_cinematic.png" alt="Шоурум Switch OLED" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="rounded-3xl bg-surface-soft p-8 lg:p-12 flex flex-col justify-between gap-10">
          <div>
            <p className="text-[24px] sm:text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-black">
              {d.mission_quote ?? "Хотим, чтобы вы включили консоль и сразу начали играть."}
            </p>
            <p className="mt-4 text-[16px] leading-[1.65] text-black/60">
              {d.mission_text1 ?? d.hero_text2 ?? "Поэтому каждую консоль мы проверяем, ставим нужные игры и объясняем, как всем пользоваться."}
            </p>
            {d.mission_text2 && <p className="mt-3 text-[16px] leading-[1.65] text-black/60">{d.mission_text2}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-[30px] sm:text-[40px] font-semibold tracking-[-0.03em] text-black">{s.value}</p>
                <p className="text-[13px] sm:text-[14px] text-black/55">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section title="Почему у нас покупают">
        <FactGrid
          columns={4}
          items={[
            { icon: ShieldCheck, title: "Гарантия 1 год", text: "Отвечаем за консоль и работы. Ремонтируем в своём сервисе." },
            { icon: Gamepad2, title: "Игры уже внутри", text: "От 15 до 100 игр в зависимости от памяти — плюс любые по вашему списку." },
            { icon: Banknote, title: "Оплата при получении", text: "Наличными курьеру или в шоуруме — без предоплат." },
            { icon: MapPin, title: "Шоурум в Москве", text: `${CONTACTS.address}. Можно прийти и всё посмотреть.` },
          ]}
        />
      </Section>

      <Section title="Коротко о нас">
        <Accordion
          items={[
            { title: "Что мы делаем", content: <p>Продаём прошитые Nintendo Switch, прошиваем консоли покупателей, ремонтируем Switch и Joy-Con, принимаем старые консоли по trade-in.</p> },
            { title: "Безопасна ли прошивка", content: <p>Мы используем прошивку с безопасным режимом: при риске бана консоль покажет ошибку и не выйдет в сеть. Базовый разгон повышает FPS и не вредит консоли.</p> },
            { title: "Помогаете после покупки?", content: <p>Да. Подскажем, как ставить новые игры, делать сохранения и пользоваться прошивкой. Видеоинструкции — в нашем Telegram-канале.</p> },
          ]}
        />
      </Section>

      <section className="rounded-3xl bg-surface-soft px-6 sm:px-10 lg:px-16 py-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <p className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-black">{d.cta_title ?? "Выберите свою консоль"}</p>
          <p className="mt-2 text-[16px] text-black/55">{d.cta_subtitle ?? "Загляните в каталог или спросите нас — поможем выбрать."}</p>
        </div>
        <PillLink href="/catalog/all" dark>Перейти в каталог</PillLink>
      </section>

      <HelpBand />
    </InfoPageShell>
  );
}
