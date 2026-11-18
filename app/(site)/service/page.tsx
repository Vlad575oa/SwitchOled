import { Metadata } from "next";
import { Wrench, ShieldCheck, Clock, Star, Check } from "lucide-react";
import { CONTACTS } from "@/lib/constants/contacts";
import { InfoPageShell, InfoHero, Section, FactGrid, Steps, HelpBand } from "@/components/info/InfoKit";
import { Accordion } from "@/components/info/Accordion";

export const metadata: Metadata = {
  title: "Сервисный центр Nintendo Switch в Москве",
  description: "Прошивка и ремонт Nintendo Switch в Москве: V1/V2, Lite, OLED, Joy-Con. Прошивка за 30 минут — 4500 ₽. Гарантия до 1 года.",
  alternates: { canonical: "/service" },
};

const plans = [
  {
    name: "Прошивка",
    subtitle: "Для вашей Switch",
    price: "4 500 ₽",
    priceNote: "разово · около 30 минут",
    detail: "Lite, Rev 1, Rev 2",
    includesTitle: "Что входит",
    includes: ["Прошивка с безопасным режимом от бана", "Базовый разгон — выше FPS", "Отключение автообновлений", "Гарантия на работу"],
  },
  {
    name: "Прошивка + 128 ГБ",
    subtitle: "Сразу можно играть",
    price: "от 6 500 ₽",
    priceNote: "разово · около 30 минут",
    detail: "около 30 игр в комплекте",
    featured: true,
    includesTitle: "Всё из «Прошивки», плюс",
    includes: ["Карта памяти 128 ГБ", "Около 30 игр на ваш выбор", "Русификаторы", "Покажем, как ставить новые игры"],
  },
  {
    name: "Прошивка + 256 ГБ",
    subtitle: "Большая библиотека",
    price: "от 8 500 ₽",
    priceNote: "разово · около 30 минут",
    detail: "около 50 игр в комплекте",
    includesTitle: "Всё из «+128 ГБ», плюс",
    includes: ["Карта памяти 256 ГБ", "Около 50 игр на ваш выбор", "Запас места для игры без интернета", "Эмуляторы классических консолей"],
  },
];

const repairs = [
  "Не включается, нет изображения или не заряжается",
  "Ремонт после неудачной прошивки или другого сервиса",
  "Восстановление после «Kamikaze» и дорожек DAT0",
  "Замена микросхем и компонентный ремонт",
  "Ремонт Joy-Con и геймпадов, дрейф стиков",
  "Чистка и профилактика консоли",
];

export default function ServicePage() {
  return (
    <InfoPageShell>
      <InfoHero
        eyebrow="Сервисный центр"
        title="Прошьём или починим вашу Switch"
        lead="Прошивка за 30 минут, большинство ремонтов — за 1–3 часа. Работаем только с Nintendo Switch, поэтому знаем её до винтика."
      >
        <a
          href={`tel:${CONTACTS.phoneHref}`}
          className="inline-flex items-center h-12 px-6 rounded-full bg-black text-white text-[15px] font-semibold hover:bg-[#2b2b2b] transition-colors"
        >
          Записаться: {CONTACTS.phoneDisplay}
        </a>
      </InfoHero>

      <Section title="Цены">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {plans.map((p) => (
            <div key={p.name} className="rounded-3xl bg-surface-soft flex flex-col">
              <div className="rounded-3xl bg-white border border-black/[0.07] p-7 lg:p-8 flex flex-col">
                <p className="text-[20px] font-medium text-black">{p.name}</p>
                <p className="mt-1 text-[15px] text-black/45">{p.subtitle}</p>
                <p className="mt-8 text-[40px] lg:text-[44px] font-medium leading-none tracking-[-0.03em] text-black">{p.price}</p>
                <p className="mt-2 text-[15px] text-black/45">{p.priceNote}</p>
                <p className="mt-6 text-[15px] text-black">{p.detail}</p>
                <a
                  href={`tel:${CONTACTS.phoneHref}`}
                  className={`mt-4 h-12 rounded-xl flex items-center justify-center text-[15px] font-medium transition-colors ${
                    p.featured ? "bg-black text-white hover:bg-[#2b2b2b]" : "bg-surface-soft text-black hover:bg-[#ececec]"
                  }`}
                >
                  Записаться
                </a>
              </div>
              <div className="px-7 lg:px-8 pt-6 pb-8">
                <p className="text-[14px] text-black/45">{p.includesTitle}</p>
                <ul className="mt-3 space-y-2.5">
                  {p.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px] leading-[1.4] text-black">
                      <span className="mt-[-1px] w-6 h-6 shrink-0 rounded-md bg-black/[0.06] flex items-center justify-center">
                        <Check size={14} strokeWidth={2} className="text-black/60" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-3xl border border-black/[0.07] px-7 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[18px] font-medium text-black">Диагностика и ремонт</p>
            <p className="text-[15px] text-black/45">Точную цену назовём после диагностики — до начала работ.</p>
          </div>
          <p className="text-[24px] font-medium tracking-[-0.02em] text-black whitespace-nowrap">от 1 500 ₽</p>
        </div>
      </Section>

      <Section>
        <FactGrid
          columns={4}
          items={[
            { icon: Clock, title: "30 минут", text: "Столько занимает прошивка — можно подождать в шоуруме." },
            { icon: ShieldCheck, title: "До 1 года гарантии", text: "На выполненные работы." },
            { icon: Star, title: "5000+ консолей", text: "Прошили за 20 с лишним лет работы." },
            { icon: Wrench, title: "Только Switch", text: "V1, V2, Lite, OLED, Joy-Con и геймпады." },
          ]}
        />
      </Section>

      <Section title="Как это происходит">
        <Steps
          items={[
            { title: "Позвоните или напишите", text: "Расскажите, что случилось, — назовём ориентировочную цену." },
            { title: "Привезите консоль", text: `В шоурум: ${CONTACTS.address}. Ежедневно 09:00–20:00.` },
            { title: "Проверим и сделаем", text: "Перед ремонтом согласуем точную стоимость — без сюрпризов." },
            { title: "Заберите готовую", text: "Покажем, как всё работает, и выдадим гарантию." },
          ]}
        />
      </Section>

      <Section title="Подробнее">
        <Accordion
          items={[
            {
              title: "Что ремонтируем",
              content: <ul className="space-y-2">{repairs.map((r) => <li key={r}>— {r}</li>)}</ul>,
            },
            {
              title: "Какие модели прошиваете?",
              content: <p>Nintendo Switch Lite, Rev 1 и Rev 2 (V1/V2). Если сомневаетесь, какая у вас модель, — пришлите фото наклейки на коробке, подскажем.</p>,
            },
            {
              title: "Что даёт прошивка?",
              content: <p>Бесплатные игры, русификаторы и эмуляторы классических консолей. Прошивка работает в безопасном режиме, который защищает от бана.</p>,
            },
            {
              title: "Можно ли потом убрать прошивку?",
              content: <p>Чип убрать практически нельзя, но можно поставить вторую систему (EmuNand) — для игры онлайн с официальным аккаунтом.</p>,
            },
          ]}
        />
      </Section>

      <HelpBand title="Не уверены, что случилось с консолью?" text="Опишите проблему в чате или по телефону — подскажем, можно ли починить и сколько это будет стоить." />
    </InfoPageShell>
  );
}
