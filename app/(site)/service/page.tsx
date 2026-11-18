import { Metadata } from "next";
import { Wrench, ShieldCheck, Clock, Star } from "lucide-react";
import { CONTACTS } from "@/lib/constants/contacts";
import { InfoPageShell, InfoHero, Section, FactGrid, Steps, HelpBand } from "@/components/info/InfoKit";
import { Accordion } from "@/components/info/Accordion";

export const metadata: Metadata = {
  title: "Сервисный центр Nintendo Switch в Москве",
  description: "Прошивка и ремонт Nintendo Switch в Москве: V1/V2, Lite, OLED, Joy-Con. Прошивка за 30 минут — 4500 ₽. Гарантия до 1 года.",
  alternates: { canonical: "/service" },
};

const prices = [
  { name: "Прошивка Nintendo Switch", price: "4 500 ₽", note: "Lite, Rev 1, Rev 2 · около 30 минут" },
  { name: "Прошивка + карта 128 ГБ с играми", price: "от 6 500 ₽", note: "около 30 игр в комплекте" },
  { name: "Прошивка + карта 256 ГБ с играми", price: "от 8 500 ₽", note: "около 50 игр в комплекте" },
  { name: "Диагностика и ремонт", price: "от 1 500 ₽", note: "цена зависит от неисправности" },
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
        <div className="divide-y divide-black/10 border-y border-black/10">
          {prices.map((p) => (
            <div key={p.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-5">
              <div>
                <p className="text-[17px] font-medium text-black">{p.name}</p>
                <p className="text-[14px] text-black/50">{p.note}</p>
              </div>
              <p className="text-[19px] font-semibold text-black whitespace-nowrap">{p.price}</p>
            </div>
          ))}
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
