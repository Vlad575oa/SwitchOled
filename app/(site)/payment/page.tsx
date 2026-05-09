import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оплата | Gameshop24",
  description: "Способы оплаты в Gameshop24: банковская карта, СБП, наличные и рассрочка. Безопасные платежи и кассовый чек.",
  alternates: { canonical: "/payment" },
};

export default function PaymentPage() {
  return (
    <div className="bg-white min-h-screen pt-10 pb-24">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-black text-secondary mb-6 uppercase">Оплата</h1>
        <div className="space-y-4 text-neutral-600 font-medium leading-relaxed">
          <p>Оплатить заказ можно банковской картой, через СБП, наличными или картой при получении в Москве, а также в рассрочку.</p>
          <p>Онлайн-платежи проходят по защищённому соединению. После оплаты вы получаете электронный кассовый чек.</p>
          <p>Если нужна помощь с оплатой или подбором удобного способа, напишите нам в Telegram или позвоните по телефону.</p>
        </div>
      </div>
    </div>
  );
}

