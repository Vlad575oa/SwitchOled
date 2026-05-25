"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

const STORAGE_KEY = "ai_chat_history";
const MAX_STORED = 40;

function loadHistory(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED)));
  } catch {}
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(loadHistory());
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, id: makeId() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    saveHistory(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (res.ok) {
        const { reply } = await res.json();
        const aiMsg: Message = { role: "assistant", content: reply, id: makeId() };
        const final = [...updated, aiMsg];
        setMessages(final);
        saveHistory(final);
      } else {
        const errMsg: Message = {
          role: "assistant",
          content: "Извините, что-то пошло не так. Попробуйте ещё раз.",
          id: makeId(),
        };
        setMessages([...updated, errMsg]);
      }
    } catch {
      const errMsg: Message = {
        role: "assistant",
        content: "Нет соединения с сервером. Проверьте интернет и попробуйте снова.",
        id: makeId(),
      };
      setMessages([...updated, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="w-[360px] bg-white rounded-3xl shadow-2xl shadow-black/20 border border-neutral-100 flex flex-col overflow-hidden"
          style={{ height: "500px" }}
        >
          {/* Header */}
          <div className="bg-[#111827] px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm">ИИ-консультант</p>
                <p className="text-neutral-400 text-[10px] font-bold">Gameshop24 · Всегда онлайн</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  title="Очистить чат"
                  className="text-neutral-500 hover:text-neutral-300 text-[10px] font-bold transition-colors"
                >
                  Очистить
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-neutral-50/30">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center pb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Bot size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#111827]">Привет! Я ИИ-консультант</p>
                  <p className="text-xs text-neutral-400 font-bold mt-1 leading-relaxed">
                    Помогу выбрать консоль, игру или<br />аксессуар под ваш бюджет и вкус
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-1">
                  {[
                    "Switch OLED или Lite — что взять?",
                    "Посоветуй для ребёнка 8 лет",
                    "Что входит в прошивку?",
                  ].map((hint) => (
                    <button
                      key={hint}
                      onClick={() => { setInput(hint); inputRef.current?.focus(); }}
                      className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 hover:border-primary/40 hover:text-primary transition-all"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "assistant" ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap",
                    msg.role === "assistant"
                      ? "bg-white border border-neutral-100 text-[#111827] rounded-bl-sm shadow-sm"
                      : "bg-primary text-white rounded-br-sm"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-neutral-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-neutral-100 bg-white flex gap-2 items-end flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Спросите что-нибудь..."
              className="flex-1 px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-medium text-[#111827] placeholder:text-neutral-300 outline-none focus:border-primary/30 focus:bg-white transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-red-700 transition-all disabled:opacity-40 shadow-lg shadow-primary/20 flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/40 hover:bg-red-700 hover:scale-110 active:scale-95 transition-all flex items-center justify-center relative"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
