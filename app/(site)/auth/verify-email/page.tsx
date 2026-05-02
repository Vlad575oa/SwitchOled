"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Подтверждаем email...");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        if (!cancelled) {
          setStatus("error");
          setMessage("Ссылка подтверждения недействительна");
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok) {
          setStatus("success");
          setMessage("Email подтвержден. Теперь вы можете войти в аккаунт.");
          return;
        }

        setStatus("error");
        setMessage(data.error || "Не удалось подтвердить email");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Ошибка соединения с сервером");
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md bg-white rounded-[32px] border border-neutral-100 p-8 shadow-sm">
        <h1 className="text-2xl font-black text-secondary mb-3">Подтверждение email</h1>
        <p className="text-sm text-neutral-500 font-medium leading-relaxed mb-6">{message}</p>

        {status !== "loading" && (
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-red-700 transition-colors"
          >
            Перейти ко входу
          </Link>
        )}
      </div>
    </div>
  );
}
