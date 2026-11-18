"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductDuplicateButton } from "./ProductDuplicateButton";
import { ProductHideButton } from "./ProductHideButton";
import { ProductDeleteButton } from "./ProductDeleteButton";
import { ProductStockToggleButton } from "./ProductStockToggleButton";
import Link from "next/link";
import { Pencil } from "lucide-react";

interface InlinePriceEditorProps {
  products: {
    id: number;
    name: string;
    price: number;
    images: string[];
    category: { name: string };
    inStock: boolean;
    isVisible: boolean;
    slug: string;
    sku?: string | null;
  }[];
  canDelete: boolean;
}

export function InlinePriceEditor({ products: initialProducts, canDelete }: InlinePriceEditorProps) {
  const [prices, setPrices] = useState<Record<number, string>>(
    Object.fromEntries(initialProducts.map((p) => [p.id, String(Math.round(p.price / 100))]))
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleChange = (id: number, value: string) => {
    setPrices((prev) => ({ ...prev, [id]: value }));
  };

  const hasChanges = initialProducts.some(
    (p) => String(Math.round(p.price / 100)) !== prices[p.id]
  );

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const updates = initialProducts
        .filter((p) => String(Math.round(p.price / 100)) !== prices[p.id])
        .map((p) => ({
          id: p.id,
          price: Math.round(parseFloat(prices[p.id]) * 100),
        }));

      const res = await fetch("/api/admin/products/bulk-update-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) throw new Error("Failed to save prices");
      
      const { toast } = await import("sonner");
      toast.success("Цены обновлены", { description: `Обновлено ${updates.length} поз.` });
      router.refresh();
    } catch (err) {
      console.error(err);
      const { toast } = await import("sonner");
      toast.error("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {hasChanges && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#111111] text-white px-6 py-3 rounded-2xl font-semibold uppercase tracking-widest text-xs shadow-2xl hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Сохранить изменения
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50">
              {["ID", "Фото", "Название", "Категория", "Цена (₽)", ""].map((h) => (
                <th key={h} className="px-5 py-3.5 text-[9px] font-semibold uppercase tracking-widest text-neutral-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialProducts.map((p) => (
              <tr key={p.id} className={`border-b border-neutral-50 last:border-0 transition-colors ${p.isVisible === false ? "opacity-60 bg-neutral-50/80" : "hover:bg-neutral-50/30"}`}>
                <td className="px-5 py-3 text-[10px] font-semibold text-neutral-400">#{p.id}</td>
                <td className="px-5 py-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-neutral-100 flex-shrink-0">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 max-w-[400px]">
                  <p className="text-xs font-semibold leading-4 text-[#111111] line-clamp-2">{p.name}</p>
                  <p className="text-[10px] text-neutral-400 font-bold mt-0.5">{p.slug}</p>
                  {p.sku && <p className="text-[10px] text-neutral-400 font-bold">Артикул: {p.sku}</p>}
                </td>
                <td className="px-5 py-3 text-xs font-bold text-neutral-500">{p.category.name}</td>
                <td className="px-5 py-3">
                  <div className="relative group/input w-32">
                    <input
                      type="number"
                      value={prices[p.id]}
                      onChange={(e) => handleChange(p.id, e.target.value)}
                      className="w-full pl-3 pr-7 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-semibold text-[#111111] outline-none focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-neutral-300">₽</span>
                  </div>
                  <div className="mt-2">
                    <ProductStockToggleButton productId={p.id} inStock={p.inStock} />
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <ProductDuplicateButton productId={p.id} />
                    <ProductHideButton productId={p.id} isVisible={p.isVisible} />
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all"
                    >
                      <Pencil size={13} />
                    </Link>
                    {canDelete && (
                      <ProductDeleteButton productId={p.id} productName={p.name} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Package } from "lucide-react";
