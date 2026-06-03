import { Metadata } from "next";
import { CONTACTS } from "@/lib/constants/contacts";

export const metadata: Metadata = {
  title: "Отзывы покупателей | Gameshop24",
  description: "Отзывы о Gameshop24 на Яндекс Картах. Реальные оценки, фото и обратная связь покупателей из Москвы и регионов.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  return (
    <div className="bg-white min-h-screen pt-10 pb-24">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-black text-secondary mb-6 uppercase">Отзывы покупателей</h1>
        <p className="text-neutral-600 font-medium leading-relaxed mb-8">
          Мы собираем прозрачную обратную связь. Основная площадка с публичными оценками — Яндекс Карты.
          Вы можете посмотреть оценки, комментарии и оставить свой отзыв после покупки.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://yandex.ru/maps/org/gameshop24/31485288867/reviews/?ll=37.379327%2C55.840783&tab=reviews&z=19"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-neutral-100 text-secondary rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Открыть на карте
          </a>
        </div>
      </div>
    </div>
  );
}
