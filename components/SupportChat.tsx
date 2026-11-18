"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Send, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type SupportMessage = {
  id: string;
  content: string;
  sender: "USER" | "ADMIN";
  createdAt: string;
};

type SupportForm = {
  name: string;
  contact: string;
  kind: "order" | "question";
  message: string;
};

const VISITOR_KEY = "support_visitor_id";
const SESSION_KEY = "support_session_id";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = `support_${makeId()}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return `support_${makeId()}`;
  }
}

function getStoredSessionId() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function storeSessionId(sessionId: string) {
  try {
    localStorage.setItem(SESSION_KEY, sessionId);
  } catch {}
}

async function readMessages(sessionId: string) {
  const response = await fetch(`/api/chat/messages?sessionId=${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Не удалось загрузить сообщения");
  return (await response.json()) as SupportMessage[];
}

export function SupportChat({ className }: { className?: string }) {
  const [form, setForm] = useState<SupportForm>({ name: "", contact: "", kind: "order", message: "" });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refreshMessages = useCallback(async (id: string) => {
    try {
      const nextMessages = await readMessages(id);
      setMessages(nextMessages);
    } catch {
      setError("Не удалось загрузить историю. Попробуйте обновить страницу.");
    }
  }, []);

  useEffect(() => {
    const storedSessionId = getStoredSessionId();
    if (!storedSessionId) return;
    setSessionId(storedSessionId);
    setLoadingMessages(true);
    refreshMessages(storedSessionId).finally(() => setLoadingMessages(false));
  }, [refreshMessages]);

  useEffect(() => {
    if (!sessionId) return;
    const interval = window.setInterval(() => refreshMessages(sessionId), 10000);
    return () => window.clearInterval(interval);
  }, [refreshMessages, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string, id: string) => {
    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id, content }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Не удалось отправить сообщение");
    }
  };

  const handleStart = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const visitorId = getVisitorId();
      const sessionResponse = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, name: form.name, email: form.contact }),
      });
      const sessionData = await sessionResponse.json();
      if (!sessionResponse.ok || !sessionData.sessionId) {
        throw new Error(sessionData?.error || "Не удалось открыть чат");
      }

      const nextSessionId = sessionData.sessionId as string;
      const topic = form.kind === "order" ? "Хочу сделать заказ" : "Задать вопрос";
      await sendMessage(`${topic}\n\n${form.message.trim()}`, nextSessionId);
      storeSessionId(nextSessionId);
      setSessionId(nextSessionId);
      setMessages(await readMessages(nextSessionId));
      setForm((current) => ({ ...current, message: "" }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось отправить обращение");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionId || !reply.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await sendMessage(reply.trim(), sessionId);
      setReply("");
      await refreshMessages(sessionId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось отправить сообщение");
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequest = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setSessionId(null);
    setMessages([]);
    setReply("");
    setError(null);
  };

  return (
    <section id="support-chat" className={cn("rounded-lg bg-secondary p-6 text-white md:p-10", className)}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-md">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <MessageCircle size={23} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Gameshop24</p>
              <h2 className="text-2xl font-black tracking-tight">Чат с поддержкой</h2>
            </div>
          </div>
          <p className="text-sm font-bold leading-relaxed text-white/60">
            Сделайте заказ или задайте любой вопрос. Менеджер увидит обращение в админке и ответит по указанному контакту.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-black text-white/70">
            <span className="rounded-full bg-white/10 px-3 py-1.5">Ответ обычно за 15 минут</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">Телефон, email или мессенджер</span>
          </div>
        </div>

        <div className="w-full max-w-xl rounded-lg bg-white p-5 text-secondary md:p-6">
          {loadingMessages ? (
            <div className="flex min-h-[260px] items-center justify-center text-neutral-400">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : sessionId ? (
            <div className="flex min-h-[260px] flex-col">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <p className="font-black">Ваше обращение</p>
                  <p className="mt-1 text-xs font-bold text-neutral-400">Ответ менеджера появится здесь</p>
                </div>
                <button type="button" onClick={handleNewRequest} className="text-xs font-black text-primary hover:underline">
                  Новое обращение
                </button>
              </div>
              <div className="max-h-64 flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.sender === "USER" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[88%] rounded-2xl px-4 py-3 text-sm font-bold leading-relaxed whitespace-pre-wrap",
                      message.sender === "USER" ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm bg-neutral-100 text-secondary"
                    )}>
                      {message.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleReply} className="mt-4 flex gap-2 border-t border-neutral-100 pt-4">
                <input
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Написать сообщение..."
                  maxLength={3000}
                  className="min-w-0 flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-bold outline-none transition-colors focus:border-primary/40"
                />
                <button type="submit" disabled={!reply.trim() || loading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-pressed disabled:opacity-40">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleStart} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-neutral-400">Ваше имя *</span>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Иван"
                    className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-bold outline-none transition-colors focus:border-primary/40 focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-neutral-400">Куда ответить *</span>
                  <input
                    required
                    minLength={3}
                    maxLength={120}
                    value={form.contact}
                    onChange={(event) => setForm({ ...form, contact: event.target.value })}
                    placeholder="Телефон, email или Telegram"
                    className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-bold outline-none transition-colors focus:border-primary/40 focus:bg-white"
                  />
                </label>
              </div>
              <div>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-neutral-400">Что нужно? *</span>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["order", "Сделать заказ"],
                    ["question", "Задать вопрос"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, kind: value })}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm font-black transition-all",
                        form.kind === value ? "border-primary bg-primary/5 text-primary" : "border-neutral-100 bg-neutral-50 text-neutral-500 hover:border-primary/30"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-neutral-400">Сообщение *</span>
                <textarea
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={4}
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  placeholder={form.kind === "order" ? "Какую консоль или товар хотите заказать?" : "Опишите вопрос — мы поможем разобраться."}
                  className="w-full resize-none rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm font-bold outline-none transition-colors focus:border-primary/40 focus:bg-white"
                />
              </label>
              {error && <p className="text-xs font-bold text-red-500">{error}</p>}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-pressed disabled:opacity-50">
                {loading ? <Loader2 size={17} className="animate-spin" /> : <UserRound size={17} />}
                {loading ? "Отправляем..." : "Написать в поддержку"}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-bold text-neutral-400">
                <CheckCircle2 size={13} className="text-green-500" /> Контакт нужен, чтобы менеджер мог ответить
              </p>
            </form>
          )}
          {error && sessionId && <p className="mt-3 text-xs font-bold text-red-500">{error}</p>}
        </div>
      </div>
    </section>
  );
}
