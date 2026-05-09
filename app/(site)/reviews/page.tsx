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
            href={CONTACTS.yandexBusinessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-neutral-900 text-white rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Отзывы в Яндекс Бизнес
          </a>
          <a
            href={CONTACTS.yandexMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-neutral-100 text-secondary rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Открыть на карте
          </a>
          <a
            href={CONTACTS.twoGisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-neutral-100 text-secondary rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Открыть в 2ГИС
          </a>
        </div>
      </div>
    </div>
  );
}
