"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const OrderDeleteButton = ({ orderId }: { orderId: number }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Удалить заказ #${orderId}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "Не удалось удалить заказ");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
      title="Удалить заказ"
    >
      <Trash2 size={13} />
    </button>
  );
};
