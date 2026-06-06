import { Metadata } from "next";
import Link from "next/link";
import { Star, ArrowLeft } from "lucide-react";
import { avitoReviews } from "@/lib/data/avito-reviews";

export const metadata: Metadata = {
  title: "Отзывы покупателей | Gameshop24",
  description: "Реальные отзывы покупателей GameShop24 с Авито. Рейтинг 5.0 · 3100+ отзывов. Nintendo Switch, PS5, игры.",
  alternates: { canonical: "/reviews" },
};

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const avatarColors = [
  "bg-red-100 text-red-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

export default function ReviewsPage() {
  return (
    <div className="bg-neutral-50 min-h-screen pt-10 pb-24">
      <div className="container max-w-5xl">

        {/* Back */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-secondary transition-colors">
            <ArrowLeft size={16} />
            На главную
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-secondary mb-3 uppercase">Отзывы покупателей</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 border border-neutral-100 shadow-sm">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <span className="text-xl font-black text-secondary">5.0</span>
              <span className="text-sm text-neutral-400 font-medium">· 3 103 отзыва</span>
            </div>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {avitoReviews.map((review) => {
            const color = avatarColors[review.id % avatarColors.length];
            return (
              <div
                key={review.id}
                className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${color}`}>
                    {getInitials(review.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-secondary truncate">{review.name}</p>
                    <p className="text-[11px] text-neutral-400 font-medium">{review.date}</p>
                  </div>
                </div>
                <StarRating />
                <p className="text-xs text-neutral-500 font-medium leading-relaxed line-clamp-1 truncate">
                  {review.item}
                </p>
                <p className="text-sm text-neutral-700 leading-relaxed font-medium line-clamp-4">
                  {review.text}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
