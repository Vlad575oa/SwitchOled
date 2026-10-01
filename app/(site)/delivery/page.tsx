import {
  Truck, MapPin, Clock, Banknote,
  ShieldCheck, Package, Zap, CheckCircle2, Navigation, Mail, PackageCheck
} from "lucide-react";
import { Metadata } from "next";
import { getPageContent } from "@/lib/getPageContent";
import { HomePageLink } from "@/components/HomePageLink";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description: "Выберите удобную доставку: СДЭК, Яндекс Доставка, Почта России, Авито Доставка, курьер по Москве или самовывоз. Оплата наличными.",
  alternates: { canonical: "/delivery" },
};

const isEnabled = (value?: string) => value !== "false";

export default async function DeliveryPage() {
  const d = await getPageContent("delivery");

  const deliveryMethods = [
    {
      visible: isEnabled(d.show_express),
      icon: Zap,
      label: "Экспресс-курьер",
      subtitle: "По Москве",
      time: d.express_time ?? "В день заказа",
      price: d.express_price ?? "500 ₽",
      free: d.express_free_from ?? "Без фиксированного порога",
      desc: d.express_desc ?? "Заказ до 14:00 — доставим сегодня. Курьер позвонит за 1 час и согласует удобное окно.",
      accent: true,
    },
    {
      visible: isEnabled(d.show_sdek),
      icon: Truck,
      label: "СДЭК",
      subtitle: "По всей России",
      time: d.sdek_time ?? "2–7 рабочих дней",
      price: d.sdek_price ?? "от 250 ₽",
      free: d.sdek_free_from ?? "Точная стоимость при оформлении",
      desc: d.sdek_desc ?? "Доставка до двери или до пункта выдачи. Трек-номер — в SMS сразу после отправки.",
      accent: false,
    },
    {
      visible: isEnabled(d.show_yandex),
      icon: Navigation,
      label: "Яндекс Доставка",
      subtitle: "Курьерская доставка",
      time: d.yandex_time ?? "От 1 дня",
      price: d.yandex_price ?? "По тарифу сервиса",
      free: d.yandex_free_from ?? "Стоимость согласуем перед отправкой",
      desc: d.yandex_desc ?? "Курьер заберёт заказ и доставит его до двери. Удобный вариант для Москвы и крупных городов.",
      accent: false,
    },
    {
      visible: isEnabled(d.show_russian_post),
      icon: Mail,
      label: "Почта России",
      subtitle: "В населённые пункты по всей стране",
      time: d.russian_post_time ?? "3–10 рабочих дней",
      price: d.russian_post_price ?? "По тарифу Почты России",
      free: d.russian_post_free_from ?? "Точную стоимость сообщит менеджер",
      desc: d.russian_post_desc ?? "Отправим заказ в отделение или до двери, если такая услуга доступна в вашем регионе.",
      accent: false,
    },
    {
      visible: isEnabled(d.show_avito),
      icon: PackageCheck,
      label: "Авито Доставка",
      subtitle: "При заказе через Авито",
      time: d.avito_time ?? "По срокам Авито",
      price: d.avito_price ?? "По тарифу Авито",
      free: d.avito_free_from ?? "Условия видны при оформлении",
      desc: d.avito_desc ?? "Выберите Авито Доставку в объявлении — статус отправления и маршрут будут доступны в приложении Авито.",
      accent: false,
    },
    {
      visible: isEnabled(d.show_pickup),
      icon: MapPin,
      label: "Самовывоз",
      subtitle: d.pickup_address ?? "Москва, м. Митино",
      time: d.pickup_time ?? "В день заказа",
      price: "Бесплатно",
      free: d.pickup_hours ?? "Ежедневно 10:00–21:00",
      desc: d.pickup_desc ?? "Заберите в нашем шоуруме: проверьте консоль на месте и получите подарок при первом визите.",
      accent: false,
    },
  ].filter((item) => item.visible);

  const paymentMethods = [
    {
      icon: Banknote,
      label: d.payments_1_title ?? "Наличные курьеру",
      desc: d.payments_1_desc ?? "Оплата наличными при получении заказа (Москва и МО).",
    },
    {
      icon: MapPin,
      label: d.payments_2_title ?? "Наличные в офисе",
      desc: d.payments_2_desc ?? "Оплата наличными при самовывозе из нашего шоурума в Митино.",
    },
    {
      icon: ShieldCheck,
      label: d.payments_3_title ?? "Безопасность",
      desc: d.payments_3_desc ?? "Вы получаете товарный чек и официальный гарантийный талон на 1 год.",
    },
  ];

  return (
    <div className="bg-white min-h-screen pt-6 pb-28">
      <div className="container max-w-[1400px] px-4 lg:px-12">

        {/* Hero */}
        <div className="mb-16 md:mb-24 space-y-8">
          <HomePageLink />
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary/10 rounded-full text-primary text-[12px] font-black uppercase tracking-[0.2em]">
            <Truck size={16} />
            {d.title ?? "Доставка и оплата"}
          </div>
          <h1 className="text-6xl md:text-8xl xl:text-9xl font-black tracking-tighter text-secondary leading-[0.85] uppercase">
            Привезём<br />
            <span className="text-primary">быстро и бережно</span>
          </h1>
          <p className="text-lg md:text-2xl text-neutral-400 font-bold max-w-3xl leading-relaxed">
            {d.hero_text ?? "Каждую консоль упаковываем в двойную коробку. Курьер звонит заранее — вы выбираете удобное время."}
          </p>
          <p className="text-base md:text-lg text-neutral-500 font-medium max-w-3xl leading-relaxed">
            Вы можете выбрать любой удобный способ доставки: СДЭК, Яндекс Доставку, Почту России, Авито Доставку, курьера по Москве или самовывоз.
          </p>
        </div>

        {/* Delivery methods */}
        {deliveryMethods.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mb-20 md:mb-32">
            {deliveryMethods.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className={`rounded-[40px] p-10 flex flex-col gap-6 ${
                    m.accent
                      ? "bg-secondary text-white"
                      : "bg-neutral-50 border border-neutral-100"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-[22px] flex items-center justify-center ${
                      m.accent ? "bg-white/15" : "bg-white shadow-sm"
                    }`}
                  >
                    <Icon size={28} className={m.accent ? "text-white" : "text-primary"} />
                  </div>
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-widest mb-1.5 ${m.accent ? "text-white/50" : "text-neutral-400"}`}>
                      {m.subtitle}
                    </p>
                    <h3 className={`text-2xl font-black ${m.accent ? "text-white" : "text-secondary"}`}>
                      {m.label}
                    </h3>
                  </div>
                  <p className={`text-base leading-relaxed font-medium ${m.accent ? "text-white/70" : "text-neutral-500"}`}>
                    {m.desc}
                  </p>
                  <div className={`mt-auto pt-6 border-t ${m.accent ? "border-white/10" : "border-neutral-100"} flex justify-between items-end`}>
                    <div>
                      <p className={`text-3xl font-black ${m.accent ? "text-white" : "text-secondary"}`}>{m.price}</p>
                      <p className={`text-xs md:text-sm font-bold ${m.accent ? "text-white/50" : "text-neutral-400"}`}>{m.free}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs md:text-sm font-black uppercase tracking-widest ${m.accent ? "text-white/60" : "text-neutral-400"}`}>
                      <Clock size={14} />
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Other cities */}
        <div className="bg-secondary rounded-[32px] p-10 flex items-start gap-8 mb-20 md:mb-32">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Truck size={28} className="text-white" />
          </div>
          <div>
            <h3 className="font-black text-white text-xl mb-3">Доставляем в другие города</h3>
            <p className="text-white/70 md:text-lg font-medium leading-relaxed max-w-3xl">
              Да, мы доставляем по всей России! Оставьте свой контактный телефон — менеджер свяжется с вами и расскажет о доступных вариантах доставки в ваш регион.
            </p>
            <a
              href="tel:79266763488"
              className="inline-block mt-6 px-8 py-4 bg-primary text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-colors"
            >
              Позвонить: 7(926)676-34-88
            </a>
          </div>
        </div>

        {/* Packaging note */}
        {isEnabled(d.show_packaging) && (
          <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-10 flex items-start gap-8 mb-20 md:mb-32">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Package size={28} className="text-primary" />
            </div>
            <div>
              <h3 className="font-black text-secondary text-xl mb-3">Как мы упаковываем консоли</h3>
              <p className="text-neutral-500 md:text-lg font-medium leading-relaxed max-w-4xl">
                {d.packaging_desc ?? "Заводская коробка производителя → пузырчатая плёнка → внешняя транспортировочная коробка с амортизирующим наполнителем. Консоль не сдвинется ни на миллиметр — даже при грубом обращении курьерской службы."}
              </p>
            </div>
          </div>
        )}

        {/* Payment */}
        {isEnabled(d.show_payments) && (
          <div className="mb-20 md:mb-32">
            <h2 className="text-4xl md:text-5xl font-black text-secondary uppercase tracking-tighter mb-12">
              {d.payments_title ?? "Способы оплаты"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentMethods.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.label} className="bg-neutral-50 rounded-[32px] p-10 flex gap-6 items-start hover:bg-white hover:shadow-xl hover:shadow-neutral-200/50 border border-transparent hover:border-neutral-100 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Icon size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-black text-secondary text-xl mb-2">{p.label}</h3>
                      <p className="text-base text-neutral-500 font-medium leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {(d.payments_conditions_title || d.payments_conditions_text) && (
              <div className="mt-8 rounded-[32px] border border-neutral-200 bg-white p-10">
                <h3 className="text-base font-black uppercase tracking-wider text-secondary mb-4">
                  {d.payments_conditions_title ?? "Условия оплаты"}
                </h3>
                <p className="text-base md:text-lg text-neutral-500 font-medium leading-relaxed">
                  {d.payments_conditions_text}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bottom guarantee strip */}
        {isEnabled(d.show_guarantees) && (
          <div className="bg-secondary rounded-[48px] p-12 md:p-16 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            {[
              { icon: ShieldCheck, text: "Официальный чек с каждым заказом" },
              { icon: CheckCircle2, text: "Проверка целостности при курьере" },
              { icon: Clock, text: "Поддержка заказа 24/7 в MAX" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex flex-col items-center gap-4">
                  <Icon size={36} className="text-primary" />
                  <p className="text-white font-bold text-base md:text-lg leading-snug">{item.text}</p>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
