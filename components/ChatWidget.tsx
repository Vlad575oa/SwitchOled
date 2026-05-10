"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("chat_visitor_id");
  if (!id) {
    id = generateId();
    localStorage.setItem("chat_visitor_id", id);
  }
  return id;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [name, setName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initSession = useCallback(async (displayName?: string) => {
    const visitorId = getVisitorId();
    const res = await fetch("/api/chat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, name: displayName ?? undefined }),
    });
    if (res.ok) {
      const { sessionId: sid } = await res.json();
      setSessionId(sid);
      return sid as string;
    }
    return null;
  }, []);

  const fetchMessages = useCallback(async (sid: string) => {
    const res = await fetch(`/api/chat/messages?sessionId=${sid}`);
    if (res.ok) {
      const data: ChatMessage[] = await res.json();
      setMessages(data);
      return data;
    }
    return [] as ChatMessage[];
  }, []);

  // Check for saved name
  useEffect(() => {
    const saved = localStorage.getItem("chat_name");
    if (saved) {
      setName(saved);
      setNameSubmitted(true);
    }
  }, []);

  // Init session on mount (to detect unread)
  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem("chat_name");
      const sid = await initSession(saved ?? undefined);
      if (sid) {
        const msgs = await fetchMessages(sid);
        const adminMsgs = msgs.filter((m) => m.sender === "ADMIN").length;
        setLastSeenCount(adminMsgs);
      }
    };
    init();
  }, [initSession, fetchMessages]);

  // Poll when open
  useEffect(() => {
    if (!isOpen || !sessionId) return;
    const interval = setInterval(async () => {
      const msgs = await fetchMessages(sessionId);
      const adminCount = msgs.filter((m) => m.sender === "ADMIN").length;
      if (adminCount > lastSeenCount) setHasUnread(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen, sessionId, fetchMessages, lastSeenCount]);

  // Poll for unread when closed
  useEffect(() => {
    if (isOpen || !sessionId) return;
    const interval = setInterval(async () => {
      const msgs = await fetchMessages(sessionId);
      const adminCount = msgs.filter((m) => m.sender === "ADMIN").length;
      if (adminCount > lastSeenCount) setHasUnread(true);
    }, 120000);
    return () => clearInterval(interval);
  }, [isOpen, sessionId, fetchMessages, lastSeenCount]);

  const handleOpen = async () => {
    setIsOpen(true);
    setHasUnread(false);
    if (sessionId) {
      const msgs = await fetchMessages(sessionId);
      const adminCount = msgs.filter((m) => m.sender === "ADMIN").length;
      setLastSeenCount(adminCount);
    }
  };

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleNameSubmit = async () => {
    if (!name.trim()) return;
    localStorage.setItem("chat_name", name.trim());
    setNameSubmitted(true);
    await initSession(name.trim());
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !sessionId) return;
    setSending(true);
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, content: input.trim() }),
    });
    if (res.ok) {
      setInput("");
      await fetchMessages(sessionId);
    }
    setSending(false);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat popup */}
      {isOpen && (
        <div className="w-[360px] bg-white rounded-3xl shadow-2xl shadow-black/20 border border-neutral-100 flex flex-col overflow-hidden" style={{ height: "480px" }}>
          {/* Header */}
          <div className="bg-[#111827] px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-white font-black text-sm italic">N</span>
              </div>
              <div>
                <p className="text-white font-black text-sm">Gameshop24</p>
                <p className="text-neutral-400 text-[10px] font-bold">Онлайн-поддержка</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Name prompt */}
          {!nameSubmitted ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
              <div className="text-center">
                <p className="text-sm font-black text-[#111827] mb-1">Как вас зовут?</p>
                <p className="text-xs text-neutral-400 font-bold">Чтобы мы знали, как к вам обращаться</p>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                placeholder="Ваше имя"
                className="w-full px-4 py-3 border border-neutral-200 rounded-2xl text-sm font-bold text-[#111827] placeholder:text-neutral-300 outline-none focus:border-primary/30"
              />
              <button
                onClick={handleNameSubmit}
                className="w-full py-3 bg-primary text-white font-black rounded-2xl hover:bg-red-700 transition-all text-sm"
              >
                Начать чат
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 bg-neutral-50/30">
                {messages.length === 0 ? (
                  <div className="text-center pt-8">
                    <p className="text-xs text-neutral-400 font-bold">Напишите нам — мы ответим как можно скорее 👋</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.sender === "ADMIN" ? "justify-start" : "justify-end")}>
                      <div className={cn(
                        "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm font-bold",
                        msg.sender === "ADMIN"
                          ? "bg-white border border-neutral-100 text-[#111827] rounded-bl-sm shadow-sm"
                          : "bg-primary text-white rounded-br-sm"
                      )}>
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={cn("text-[9px] mt-0.5 font-bold", msg.sender === "ADMIN" ? "text-neutral-300" : "text-white/60 text-right")}>
                          {new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-neutral-100 bg-white flex gap-2 items-end flex-shrink-0">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ваше сообщение..."
                  className="flex-1 px-4 py-2.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold text-[#111827] placeholder:text-neutral-300 outline-none focus:border-primary/30 focus:bg-white transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-red-700 transition-all disabled:opacity-40 shadow-lg shadow-primary/20 flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={handleOpen}
        className="w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/40 hover:bg-red-700 hover:scale-110 active:scale-95 transition-all flex items-center justify-center relative"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  );
}
