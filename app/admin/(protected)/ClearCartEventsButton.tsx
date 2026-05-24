"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ClearCartEventsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClear() {
    if (!confirm("Очистить всю статистику корзины? Это действие необратимо.")) return;
    setLoading(true);
    await fetch("/api/admin/cart-events", { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClear}
      disabled={loading}
      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      <Trash2 size={12} />
      {loading ? "Очистка..." : "Очистить"}
    </button>
  );
}
