import { ShieldCheck, Package, RotateCcw } from "lucide-react";
import { Metadata } from "next";
import { getPageContent } from "@/lib/getPageContent";
import { InfoPageShell, InfoHero, Section, FactGrid, Steps, HelpBand } from "@/components/info/InfoKit";
import { Accordion } from "@/components/info/Accordion";
import { CONTACTS } from "@/lib/constants/contacts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Гарантия и возврат",
  description: "Гарантия магазина 1 год на консоли. Возврат в течение 14 дней. Бесплатный ремонт при заводском браке.",
  alternates: { canonical: "/warranty" },
};

const covered = [
  "Заводские дефекты экрана, кнопок и разъёмов",
  "Неисправности батареи при обычном использовании",
  "Проблемы с прошивкой и программным обеспечением",
  "Дрейф стиков Joy-Con — по отдельной договорённости",
];

const notCovered = [
  "Падения, сколы, трещины и другие механические повреждения",
  "Попадание жидкости внутрь корпуса",
  "Самостоятельный ремонт или вскрытие корпуса",
  "Блокировки аккаунта за нарушение правил Nintendo",
];

export default async function WarrantyPage() {
  const d = await getPageContent("warranty");

  const warrantyPeriod = d.warranty_period ?? "12 месяцев";
  const accessoriesPeriod = d.accessories_period ?? "6 месяцев";
  const returnPeriod = d.return_period ?? "14 дней";
  const email = d.email ?? CONTACTS.email;

  return (
    <InfoPageShell>
      <InfoHero
        eyebrow={d.title ?? "Гарантия и возврат"}
        title="Год гарантии на каждую консоль"
        lead={d.warranty_text ?? "Если с консолью что-то не так — починим или заменим бесплатно. Без лишних бумаг и долгих разбирательств."}
      />

      <Section>
        <FactGrid
          items={[
            {
              icon: ShieldCheck,
              title: `Консоли — ${warrantyPeriod}`,
              text: d.warranty_desc ?? "Гарантия магазина. Заводской брак — бесплатный ремонт или замена в нашем сервисе в Москве.",
              dark: true,
            },
            {
              icon: Package,
              title: `Аксессуары — ${accessoriesPeriod}`,
              text: d.accessories_desc ?? "Контроллеры, зарядки, чехлы. Если обнаружится брак — заменим за 7 рабочих дней.",
            },
            {
              icon: RotateCcw,
              title: `Возврат — ${returnPeriod}`,
              text: "Можно вернуть товар, если он не использовался и сохранена упаковка.",
            },
          ]}
        />
      </Section>

      <Section title="Что делать, если консоль сломалась">
        <Steps
          items={[
            { title: "Напишите нам", text: `В чат на сайте, по телефону или на ${email}. Укажите номер заказа.` },
            { title: "Покажите проблему", text: "Пришлите фото или короткое видео — так мы быстрее поймём, в чём дело." },
            { title: "Передайте консоль", text: "Привезите в шоурум или отправьте нам — подскажем, как удобнее." },
            { title: "Починим или заменим", text: "Диагностика — 3–5 рабочих дней, ремонт или замена — до 14 дней." },
          ]}
        />
      </Section>

      <Section title="Подробнее об условиях">
        <Accordion
          items={[
            {
              title: "Что покрывает гарантия",
              content: (
                <ul className="space-y-2">
                  {covered.map((item) => <li key={item}>— {item}</li>)}
                </ul>
              ),
            },
            {
              title: "Что не покрывает гарантия",
              content: (
                <ul className="space-y-2">
                  {notCovered.map((item) => <li key={item}>— {item}</li>)}
                </ul>
              ),
            },
            {
              title: "Как вернуть товар",
              content: (
                <p>
                  {d.return_text ??
                    `Товар надлежащего качества можно вернуть в течение ${returnPeriod}, если он не использовался и сохранены товарный вид и упаковка (Закон «О защите прав потребителей»). Консоли надлежащего качества после активации относятся к технически сложным товарам и возврату не подлежат — но мы всегда ищем решение вместе с вами.`}
                </p>
              ),
            },
            {
              title: "Слетит ли гарантия из-за прошивки?",
              content: <p>Нет. Мы продаём уже прошитые консоли и сами отвечаем за них целый год — гарантия магазина действует с прошивкой.</p>,
            },
            {
              title: "Какие документы нужны",
              content: <p>Товарный чек, который мы выдаём при покупке, или номер заказа.</p>,
            },
          ]}
        />
      </Section>

      <HelpBand title="Есть вопрос по гарантии?" text="Опишите проблему в чате или позвоните — подскажем, что делать дальше." />
    </InfoPageShell>
  );
}
