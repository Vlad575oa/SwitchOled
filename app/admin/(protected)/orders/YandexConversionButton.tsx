"use client";

import { Check, Loader2, Send } from "lucide-react";
import { useState } from "react";

interface Props {
  orderId: number;
  status: string;
  sentAt?: string | null;
  hasAttribution: boolean;
}

export function YandexConversionButton({ orderId, status, sentAt, hasAttribution }: Props) {
  const [sent, setSent] = useState(Boolean(sentAt));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSend = status === "paid" || status === "completed";

  const handleSend = async () => {
    if (loading || sent || !canSend) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/yandex`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || "Не удалось передать конверсию");
      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Ошибка передачи");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return <span title="Конверсия передана в Яндекс Метрику" className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-green-700"><Check size={12} /> Передано</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend || !hasAttribution || loading}
        title={!canSend ? "Доступно после оплаты или завершения заказа" : !hasAttribution ? "У заказа нет ClientID или yclid" : "Передать оплаченный заказ в Яндекс Метрику"}
        className="inline-flex items-center gap-1 rounded-lg border border-[#3158f5]/20 bg-[#3158f5]/5 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#3158f5] transition-colors hover:bg-[#3158f5] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        Передать
      </button>
      {error && <span title={error} className="max-w-[150px] text-[9px] font-bold leading-tight text-red-500">Ошибка передачи</span>}
    </div>
  );
}
