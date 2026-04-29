"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Ошибка входа");
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
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-black text-2xl italic">N</span>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-[32px] border border-neutral-100 p-8 shadow-sm">
          <h1 className="text-2xl font-black text-secondary mb-1">Вход в аккаунт</h1>
          <p className="text-sm text-neutral-400 font-medium mb-8">
            Нет аккаунта?{" "}
            <Link href="/auth/register" className="text-primary font-bold hover:underline">
              Зарегистрироваться
            </Link>
          </p>

          <div className="flex justify-end mb-2 -mt-4">
            <Link href="/auth/forgot-password" className="text-xs font-bold text-neutral-400 hover:text-primary transition-colors">
              Забыли пароль?
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1 mb-2 block">
                Email адрес
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoFocus
                className="w-full px-5 py-4 bg-neutral-50 border border-neutral-100 focus:border-primary/30 focus:bg-white rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-neutral-300"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1 mb-2 block">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-xs font-bold py-3 px-4 rounded-2xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-red-700 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Войти <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
