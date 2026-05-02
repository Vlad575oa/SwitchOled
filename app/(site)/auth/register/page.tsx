"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";

type RegisterFieldProps = {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  hint?: string;
};

function RegisterField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  hint,
}: RegisterFieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
          {label}
        </label>
        {hint && <span className="text-[10px] text-neutral-300 font-medium">{hint}</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-5 py-4 bg-neutral-50 border border-neutral-100 focus:border-primary/30 focus:bg-white rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-neutral-300"
      />
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email) {
      return setError("Укажите email");
    }
    if (form.password.length < 8) {
      return setError("Пароль должен содержать не менее 8 символов");
    }
    if (form.password !== form.confirm) {
      return setError("Пароли не совпадают");
    }
    if (!consent) {
      return setError("Подтвердите согласие на обработку персональных данных");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          email: form.email || undefined,
          password: form.password,
          consent,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Ошибка регистрации");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-black text-2xl italic">N</span>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-[32px] border border-neutral-100 p-8 shadow-sm">
          <h1 className="text-2xl font-black text-secondary mb-1">Создать аккаунт</h1>
          <p className="text-sm text-neutral-400 font-medium mb-8">
            Уже есть аккаунт?{" "}
            <Link href="/auth/login" className="text-primary font-bold hover:underline">
              Войти
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <RegisterField
              label="Имя"
              placeholder="Ваше имя"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              hint="необязательно"
            />

            <RegisterField
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              required
            />

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1 mb-2 block">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Минимум 8 символов"
                  required
                  className="w-full px-5 py-4 pr-12 bg-neutral-50 border border-neutral-100 focus:border-primary/30 focus:bg-white rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-neutral-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <RegisterField
              label="Повтор пароля"
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setField("confirm", e.target.value)}
              required
            />

            <label className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  consent
                    ? "border-primary bg-primary text-white"
                    : "border-neutral-300 bg-white text-transparent"
                }`}
                aria-hidden="true"
              >
                <Check size={16} strokeWidth={3} />
              </span>
              <span className="text-xs leading-relaxed text-neutral-600 font-medium">
                Я даю свое согласие на обработку персональных данных в соответствии с{" "}
                <Link href="/legal/privacy" className="font-bold text-primary hover:underline">
                  Политикой конфиденциальности
                </Link>
                .
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-xs font-bold py-3 px-4 rounded-2xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.password || !form.confirm || !consent}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-red-700 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Создать аккаунт <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
