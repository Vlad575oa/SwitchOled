"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ProductStockToggleButton({ productId, inStock }: { productId: number; inStock: boolean }) {
  const [isInStock, setIsInStock] = useState(inStock);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const setStock = (next: boolean) => {
    if (pending || next === isInStock) return;
    setIsInStock(next);
    startTransition(async () => {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: next }),
      });
      router.refresh();
    });
  };

  return (
    <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white p-0.5">
      <button
        type="button"
        onClick={() => setStock(true)}
        disabled={pending}
        className={`px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
          isInStock ? "bg-green-100 text-green-700" : "text-neutral-400 hover:text-green-700"
        }`}
      >
        В наличии
      </button>
      <button
        type="button"
        onClick={() => setStock(false)}
        disabled={pending}
        className={`px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
          !isInStock ? "bg-neutral-200 text-neutral-600" : "text-neutral-400 hover:text-neutral-600"
        }`}
      >
        Под заказ
      </button>
    </div>
  );
}
