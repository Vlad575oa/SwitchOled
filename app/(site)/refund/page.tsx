import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Возврат и обмен | Gameshop24",
  description: "Условия возврата и обмена в Gameshop24: сроки, порядок обращения, гарантийные случаи и возврат средств.",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <div className="bg-white min-h-screen pt-10 pb-24">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-black text-secondary mb-6 uppercase">Возврат и обмен</h1>
        <div className="space-y-4 text-neutral-600 font-medium leading-relaxed">
          <p>Если товар оказался с заводским дефектом, мы организуем проверку и предложим ремонт, обмен или возврат средств.</p>
          <p>Товар надлежащего качества можно вернуть в течение 14 дней при сохранении товарного вида и упаковки.</p>
          <p>Для оформления заявки сообщите номер заказа и опишите ситуацию — мы подскажем следующий шаг без лишней бюрократии.</p>
        </div>
      </div>
    </div>
  );
}

