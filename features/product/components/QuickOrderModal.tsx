"use client";

import { FormEvent, useState } from "react";
import { X, PhoneCall, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type Props = { product: { id: number; name: string }; buttonClassName?: string };

function formatRussianPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits.startsWith("9")) digits = `7${digits}`;
  if (!digits.startsWith("7")) digits = `7${digits}`;
  digits = digits.slice(0, 11);

  let result = "+7";
  if (digits.length > 1) result += ` (${digits.slice(1, 4)}`;
  if (digits.length >= 4) result += `) ${digits.slice(4, 7)}`;
  if (digits.length > 7) result += `-${digits.slice(7, 9)}`;
  if (digits.length > 9) result += `-${digits.slice(9, 11)}`;
  return result;
}

export function QuickOrderModal({ product, buttonClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
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
        body: JSON.stringify({ name, phone, productId: product.id, consent }),
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
        onClick={() => { setOpen(true); setSent(false); setError(""); setConsent(false); }}
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
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatRussianPhone(e.target.value))}
                  placeholder="+7 (___) ___-__-__"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={18}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium outline-none focus:border-primary"
                />
                <label className="flex items-start gap-2 cursor-pointer text-[11px] leading-relaxed text-neutral-500">
                  <input
                    required
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span>
                    Я согласен на обработку персональных данных и принимаю условия
                    <Link href="/legal/privacy" target="_blank" className="ml-1 text-primary hover:underline">
                      политики конфиденциальности
                    </Link>
                  </span>
                </label>
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
