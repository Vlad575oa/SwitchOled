import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оплата | Gameshop24",
  description: "Информация об оплате в Gameshop24. Мы принимаем оплату наличными при получении курьеру или в нашем офисе.",
  alternates: { canonical: "/payment" },
};

export default function PaymentPage() {
  return (
    <div className="bg-white min-h-screen pt-10 pb-24">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-black text-secondary mb-6 uppercase">Оплата</h1>
        <div className="space-y-4 text-neutral-600 font-medium leading-relaxed">
          <p>В магазине Gameshop24 оплата производится исключительно <strong>наличными</strong>.</p>
          <p>Вы можете оплатить ваш заказ следующими способами:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Наличными курьеру</strong> при получении заказа (для Москвы и МО).</li>
            <li><strong>Наличными в нашем офисе</strong> при самовывозе.</li>
          </ul>
          <p>При оплате вы получаете товарный чек и гарантийный талон сроком на 1 год.</p>
          <p>Обращаем ваше внимание, что онлайн-оплата на сайте, банковские карты и QR-коды временно не поддерживаются.</p>
          <p>Если у вас остались вопросы по способам оплаты, напишите нам в MAX или позвоните по телефону.</p>
        </div>
      </div>
    </div>
  );
}
