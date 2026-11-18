import { Metadata } from "next";
import { Star } from "lucide-react";
import { avitoReviews } from "@/lib/data/avito-reviews";
import { InfoPageShell, InfoHero, Section, HelpBand } from "@/components/info/InfoKit";
import { ReviewsGrid } from "./ReviewsGrid";

export const metadata: Metadata = {
  title: "Отзывы покупателей",
  description: "Реальные отзывы покупателей Switch OLED с Авито. Рейтинг 5.0 · 3100+ отзывов.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  return (
    <InfoPageShell>
      <InfoHero
        eyebrow="Отзывы покупателей"
        title="Нам доверяют тысячи игроков"
        lead="Реальные отзывы с Авито — о консолях, доставке и помощи после покупки."
      >
        <div className="inline-flex items-center gap-3 rounded-full bg-white px-5 h-12">
          <span className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} className="fill-black text-black" />)}
          </span>
          <span className="text-[17px] font-semibold text-black">5.0</span>
          <span className="text-[15px] text-black/50">· 3 103 отзыва на Авито</span>
        </div>
      </InfoHero>
      <Section>
        <ReviewsGrid reviews={avitoReviews} />
      </Section>
      <HelpBand />
    </InfoPageShell>
  );
}
