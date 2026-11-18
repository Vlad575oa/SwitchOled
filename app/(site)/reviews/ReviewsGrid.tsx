"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { AvitoReview } from "@/lib/data/avito-reviews";

const PAGE = 12;

function initials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length === 1 ? parts[0][0]?.toUpperCase() ?? "?" : (parts[0][0] + parts[1][0]).toUpperCase();
}

// Reviews revealed in pages of 12 so the page stays short.
export function ReviewsGrid({ reviews }: { reviews: AvitoReview[] }) {
  const [shown, setShown] = useState(PAGE);
  const left = reviews.length - shown;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {reviews.slice(0, shown).map((r) => (
          <article key={r.id} className="rounded-2xl bg-surface-soft p-6 flex flex-col gap-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
                {initials(r.name)}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-black truncate">{r.name}</p>
                <p className="text-[13px] text-black/45">{r.date}</p>
              </div>
              <div className="ml-auto flex gap-0.5" aria-label="5 из 5">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} className="fill-black text-black" />)}
              </div>
            </div>
            <p className="text-[15px] leading-[1.6] text-black/80">{r.text}</p>
            <p className="mt-auto text-[13px] text-black/45 truncate">{r.item}</p>
          </article>
        ))}
      </div>
      {left > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="h-12 px-6 rounded-full border border-black/15 text-[15px] font-semibold text-black hover:border-black transition-colors"
          >
            Показать ещё {Math.min(PAGE, left)}
          </button>
        </div>
      )}
    </div>
  );
}
