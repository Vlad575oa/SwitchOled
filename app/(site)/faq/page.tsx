import prisma from "@/lib/prisma";
import FAQClient from "@/components/FAQClient";
import { Metadata } from "next";
import { InfoPageShell, InfoHero, Section, HelpBand } from "@/components/info/InfoKit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Вопросы и ответы (FAQ) | Поддержка",
  description: "Ответы на частые вопросы о прошитых Nintendo Switch: игры, прошивка, оплата, доставка и гарантия.",
  alternates: { canonical: "/faq" },
};

// Shown until FAQs are added in the admin panel.
const DEFAULT_FAQS = [
  { category: "Прошивка", question: "Что значит «прошитая» консоль?", answer: "На консоль установлена дополнительная система. Она позволяет бесплатно устанавливать игры, ставить русификаторы и запускать эмуляторы классических приставок." },
  { category: "Прошивка", question: "Могут ли забанить консоль?", answer: "Прошивка работает в «безопасном режиме»: при риске бана она выдаёт ошибку и не даёт выйти в сеть. Это сводит риск к минимуму." },
  { category: "Прошивка", question: "Можно ли играть онлайн?", answer: "Да, через вторую систему EmuNand. Понадобится зарубежный аккаунт Nintendo и активная подписка." },
  { category: "Прошивка", question: "Нужно ли обновлять консоль?", answer: "Автообновления лучше отключить в настройках — иначе прошивка может перестать работать. Мы отключаем их перед выдачей." },
  { category: "Прошивка", question: "Прошиваете консоли покупателей?", answer: "Да: Switch Lite, Rev 1 и Rev 2. Стоимость — 4500 ₽, занимает около 30 минут." },
  { category: "Игры и память", question: "Сколько игр уже установлено?", answer: "Зависит от карты памяти: 64 ГБ — около 15 игр, 128 ГБ — около 30, 256 ГБ — около 50, 512 ГБ — около 100." },
  { category: "Игры и память", question: "Можно установить игры, которые я хочу?", answer: "Да, поставим любые игры по вашему списку — для Switch их больше 10 000." },
  { category: "Игры и память", question: "Как добавить игры самому?", answer: "Через приложения NotUltraNX или Tinfoil прямо на консоли, либо с компьютера по проводу. Покажем, как это делать." },
  { category: "Игры и память", question: "Какую карту памяти выбрать?", answer: "Для игры без интернета хватит 256 ГБ. Если нужна вторая система для онлайна — берите 512 ГБ. Поддерживаются карты до 1 ТБ." },
  { category: "Оплата и доставка", question: "Как оплатить заказ?", answer: "Только наличными: курьеру при получении или в шоуруме при самовывозе. Онлайн-оплату и карты не принимаем." },
  { category: "Оплата и доставка", question: "Как быстро привезёте?", answer: "По Москве — в день заказа. В другие города отправляем СДЭК, Яндекс Доставкой, Почтой России или через Авито." },
  { category: "Оплата и доставка", question: "Как проходит заказ?", answer: "Вы оформляете заказ, менеджер перезванивает и уточняет детали, затем мы быстро отправляем консоль." },
  { category: "Гарантия и обмен", question: "Какая гарантия?", answer: "1 год от нашего магазина на консоль и выполненные работы." },
  { category: "Гарантия и обмен", question: "Можно вернуть товар?", answer: "В течение 14 дней, если товар не использовался и упаковка цела." },
  { category: "Гарантия и обмен", question: "Принимаете старые консоли?", answer: "Да, по trade-in — зачтём стоимость старой консоли в счёт новой." },
].map((f, i) => ({ id: -(i + 1), ...f }));

export default async function FAQPage() {
  const dbFaqs = await prisma.fAQ
    .findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] })
    .catch(() => []);
  const faqs = dbFaqs.length > 0 ? dbFaqs : DEFAULT_FAQS;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <InfoPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <InfoHero
        eyebrow="Вопросы и ответы"
        title="Отвечаем на частые вопросы"
        lead="Про прошивку, игры, оплату и гарантию — коротко и по делу. Не нашли ответ? Напишите нам."
      />
      <Section>
        <FAQClient faqs={faqs} />
      </Section>
      <HelpBand />
    </InfoPageShell>
  );
}
