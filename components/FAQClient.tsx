"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Accordion } from "@/components/info/Accordion";
import { cn } from "@/lib/utils";

type FAQ = {
  id: number;
  question: string;
  answer: string;
  category: string;
};

// Search + category chips over the smooth accordion.
export default function FAQClient({ faqs }: { faqs: FAQ[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Все");

  const categories = useMemo(
    () => ["Все", ...Array.from(new Set(faqs.map((f) => f.category)))],
    [faqs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter(
      (f) =>
        (category === "Все" || f.category === category) &&
        (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q))
    );
  }, [faqs, query, category]);

  const groups = useMemo(() => {
    const map = new Map<string, FAQ[]>();
    filtered.forEach((f) => map.set(f.category, [...(map.get(f.category) ?? []), f]));
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <label className="relative w-full lg:max-w-[420px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти ответ, например «игры» или «доставка»"
            className="w-full h-12 pl-11 pr-10 rounded-full bg-surface-soft text-[15px] text-black placeholder:text-black/40 outline-none border border-transparent focus:border-black/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Очистить"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-black/50"
            >
              <X size={15} />
            </button>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "h-10 px-4 rounded-full text-[14px] border transition-colors",
                category === c ? "bg-black border-black text-white" : "border-black/15 text-black hover:border-black"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 space-y-12">
        {groups.length === 0 && (
          <p className="text-[16px] text-black/55">
            Ничего не нашли. Попробуйте другое слово или напишите нам в чат — ответим.
          </p>
        )}
        {groups.map(([group, items]) => (
          <div key={group}>
            <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-black mb-4">{group}</h2>
            <Accordion
              items={items.map((f) => ({
                title: f.question,
                content: f.answer.split(/\n+/).map((line, i) => <p key={i}>{line}</p>),
              }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
