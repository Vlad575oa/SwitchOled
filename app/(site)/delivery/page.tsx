import { Truck, MapPin, Zap, Navigation, Mail, PackageCheck, Banknote } from "lucide-react";
import { Metadata } from "next";
import { getPageContent } from "@/lib/getPageContent";
import { InfoPageShell, InfoHero, Section, FactGrid, Steps, HelpBand } from "@/components/info/InfoKit";
import { Accordion } from "@/components/info/Accordion";
import { CONTACTS } from "@/lib/constants/contacts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description: "Курьер по Москве в день заказа, самовывоз, СДЭК, Яндекс Доставка, Почта России и Авито по всей России. Оплата наличными при получении.",
  alternates: { canonical: "/delivery" },
};

const isEnabled = (value?: string) => value !== "false";

export default async function DeliveryPage() {
  const d = await getPageContent("delivery");

  const methods = [
    {
      visible: isEnabled(d.show_express),
      icon: Zap,
      title: "Курьер по Москве",
      text: d.express_desc ?? "Закажите до 14:00 — привезём сегодня. Курьер позвонит за час до приезда.",
      meta: `${d.express_time ?? "В день заказа"} · ${d.express_price ?? "500 ₽"}`,
      dark: true,
    },
    {
      visible: isEnabled(d.show_pickup),
      icon: MapPin,
      title: "Самовывоз из шоурума",
      text: d.pickup_desc ?? `Приезжайте в шоурум: ${d.pickup_address ?? CONTACTS.address}. Проверите консоль на месте.`,
      meta: `${d.pickup_time ?? "В день заказа"} · бесплатно`,
    },
    {
      visible: isEnabled(d.show_sdek),
      icon: Truck,
      title: "СДЭК",
      text: d.sdek_desc ?? "До двери или до пункта выдачи по всей России. Трек-номер пришлём в SMS.",
      meta: `${d.sdek_time ?? "2–7 рабочих дней"} · ${d.sdek_price ?? "от 250 ₽"}`,
    },
    {
      visible: isEnabled(d.show_yandex),
      icon: Navigation,
      title: "Яндекс Доставка",
      text: d.yandex_desc ?? "Курьер привезёт заказ до двери. Удобно для Москвы и крупных городов.",
      meta: `${d.yandex_time ?? "От 1 дня"} · ${d.yandex_price ?? "по тарифу сервиса"}`,
    },
    {
      visible: isEnabled(d.show_russian_post),
      icon: Mail,
      title: "Почта России",
      text: d.russian_post_desc ?? "В любой населённый пункт — в отделение или до двери.",
      meta: `${d.russian_post_time ?? "3–10 рабочих дней"} · ${d.russian_post_price ?? "по тарифу Почты"}`,
    },
    {
      visible: isEnabled(d.show_avito),
      icon: PackageCheck,
      title: "Авито Доставка",
      text: d.avito_desc ?? "Если удобнее покупать на Авито — выберите доставку прямо в объявлении.",
      meta: `${d.avito_time ?? "По срокам Авито"} · ${d.avito_price ?? "по тарифу Авито"}`,
    },
  ].filter((m) => m.visible);

  return (
    <InfoPageShell>
      <InfoHero
        eyebrow={d.title ?? "Доставка и оплата"}
        title="Привезём сегодня по Москве, отправим в любой город"
        lead={d.hero_text ?? "Платите наличными, когда получите консоль и проверите её. Никаких предоплат."}
      />

      {methods.length > 0 && (
        <Section title="Как получить заказ" lead="Выберите удобный способ — менеджер подтвердит детали по телефону.">
          <FactGrid items={methods} />
        </Section>
      )}

      <Section title="Как проходит заказ">
        <Steps
          items={[
            { title: "Оформите заказ", text: "На сайте, в чате или по телефону — как вам удобнее." },
            { title: "Подтвердим по телефону", text: "Менеджер перезвонит, уточнит комплектацию и способ доставки." },
            { title: "Отправим быстро", text: "По Москве — в тот же день, в регионы — в ближайшую отправку." },
            { title: "Проверите и оплатите", text: "Оплата наличными при получении. Выдадим товарный чек." },
          ]}
        />
      </Section>

      {isEnabled(d.show_payments) && (
        <Section title={d.payments_title ?? "Оплата"} lead="Принимаем только наличные — так быстрее и проще для всех.">
          <FactGrid
            columns={2}
            items={[
              {
                icon: Banknote,
                title: d.payments_1_title ?? "Наличными курьеру",
                text: d.payments_1_desc ?? "Оплачиваете, когда курьер передал заказ и вы всё проверили.",
              },
              {
                icon: MapPin,
                title: d.payments_2_title ?? "Наличными в шоуруме",
                text: d.payments_2_desc ?? "При самовывозе — оплата на месте после проверки консоли.",
              },
            ]}
          />
        </Section>
      )}

      <Section title="Частые вопросы о доставке">
        <Accordion
          items={[
            {
              title: "Доставляете в другие города?",
              content: (
                <p>
                  Да, по всей России — СДЭК, Яндекс Доставкой, Почтой России или через Авито. Позвоните{" "}
                  <a href={`tel:${CONTACTS.phoneHref}`} className="text-black underline underline-offset-4">{CONTACTS.phoneDisplay}</a>{" "}
                  — подберём лучший вариант для вашего города.
                </p>
              ),
            },
            ...(isEnabled(d.show_packaging)
              ? [{
                  title: "Как упаковываете консоль?",
                  content: (
                    <p>
                      {d.packaging_desc ??
                        "Заводская коробка, затем пузырчатая плёнка и внешняя транспортная коробка с наполнителем. Консоль доедет целой даже при грубой перевозке."}
                    </p>
                  ),
                }]
              : []),
            {
              title: "Можно проверить консоль перед оплатой?",
              content: <p>Да. Курьер подождёт, пока вы включите консоль и убедитесь, что всё работает. В шоуруме покажем всё на месте.</p>,
            },
            {
              title: "Какие документы я получу?",
              content: <p>Товарный чек и гарантию магазина на 1 год.</p>,
            },
            {
              title: "Когда работает шоурум?",
              content: <p>Ежедневно с 09:00 до 20:00. Адрес: {d.pickup_address ?? CONTACTS.address}.</p>,
            },
          ]}
        />
      </Section>

      {(d.payments_conditions_title || d.payments_conditions_text) && (
        <Section title={d.payments_conditions_title ?? "Условия оплаты"}>
          <p className="max-w-[760px] text-[16px] leading-[1.65] text-black/65">{d.payments_conditions_text}</p>
        </Section>
      )}

      <HelpBand />
    </InfoPageShell>
  );
}
