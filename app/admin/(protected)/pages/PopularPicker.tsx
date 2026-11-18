"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";

interface AdminProduct {
  id: number;
  name: string;
  price: number;
  images: string[];
  isVisible: boolean;
  category?: { name: string } | null;
}

const rub = (kopecks: number) => `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽`;

// Picks and orders products for the «Популярное» rail on the home page.
export function PopularPicker({ value, onChange }: { value: number[]; onChange: (ids: number[]) => void }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: AdminProduct[]) => setProducts(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selected = value.map((id) => byId.get(id)).filter((p): p is AdminProduct => Boolean(p));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.isVisible && !value.includes(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [products, query, value]);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...value];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const thumb = (p: AdminProduct) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.images[0] || "/images/placeholder.webp"} alt="" className="w-11 h-11 rounded-lg object-contain bg-neutral-50 shrink-0" />
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#111111] mb-1">Популярное на главной</p>
        <p className="text-xs text-neutral-400 font-medium">
          Выберите товары и порядок. Если список пустой — показываются последние добавленные товары.
        </p>
      </div>

      {selected.length > 0 ? (
        <ol className="space-y-2">
          {selected.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2">
              <span className="w-6 text-center text-xs text-neutral-400">{i + 1}</span>
              {thumb(p)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#111111] truncate">{p.name}</p>
                <p className="text-xs text-neutral-400">{rub(p.price)}</p>
              </div>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше" className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center disabled:opacity-30">
                <ArrowUp size={15} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === selected.length - 1} aria-label="Ниже" className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center disabled:opacity-30">
                <ArrowDown size={15} />
              </button>
              <button type="button" onClick={() => onChange(value.filter((id) => id !== p.id))} aria-label="Убрать" className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600 flex items-center justify-center">
                <X size={15} />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-500">Пока ничего не выбрано.</p>
      )}

      <div>
        <label className="relative block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти товар, чтобы добавить"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-neutral-200 bg-white text-sm outline-none focus:border-black/40"
          />
        </label>
        <ul className="mt-2 divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-white">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onChange([...value, p.id])}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-neutral-50"
              >
                {thumb(p)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#111111] truncate">{p.name}</p>
                  <p className="text-xs text-neutral-400">{p.category?.name} · {rub(p.price)}</p>
                </div>
                <Plus size={16} className="text-neutral-400" />
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-3 text-xs text-neutral-400">Ничего не найдено</li>}
        </ul>
      </div>
    </div>
  );
}
