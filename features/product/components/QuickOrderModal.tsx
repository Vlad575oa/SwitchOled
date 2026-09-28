"use client";

import { FormEvent, useState } from "react";
import { X, PhoneCall, CheckCircle2 } from "lucide-react";

type Props = { product: { id: number; name: string }; buttonClassName?: string };

export function QuickOrderModal({ product, buttonClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/quick-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, productId: product.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось отправить заявку");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить заявку");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setSent(false); setError(""); }}
        className={buttonClassName ?? "flex-1 h-10 rounded-2xl border border-primary/25 bg-primary/5 px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-primary hover:bg-primary hover:text-white transition-colors"}
      >
        Купить в 1 клик
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><p className="text-lg font-black text-secondary">Купить в 1 клик</p><p className="mt-1 text-xs font-medium text-neutral-400">Менеджер перезвонит и уточнит детали заказа</p></div>
              <button type="button" aria-label="Закрыть" onClick={() => setOpen(false)} className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100"><X size={18} /></button>
            </div>
            {sent ? (
              <div className="py-6 text-center"><CheckCircle2 className="mx-auto mb-3 text-green-500" size={42} /><p className="font-black text-secondary">Заявка отправлена</p><p className="mt-1 text-sm text-neutral-500">Мы скоро свяжемся с вами по телефону.</p><button type="button" onClick={() => setOpen(false)} className="mt-5 rounded-xl bg-secondary px-5 py-3 text-xs font-black text-white">Понятно</button></div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <p className="rounded-xl bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-600">{product.name}</p>
                <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium outline-none focus:border-primary" />
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" type="tel" className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium outline-none focus:border-primary" />
                {error && <p className="text-xs font-bold text-red-500">{error}</p>}
                <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60"><PhoneCall size={16} />{loading ? "Отправляем…" : "Отправить заявку"}</button>
                <p className="text-center text-[10px] font-medium text-neutral-400">Оплата только наличными после подтверждения заказа</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
