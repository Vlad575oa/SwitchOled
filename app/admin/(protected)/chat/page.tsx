"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Send, CheckCircle, Circle, MessageSquare, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSessionItem {
  id: string;
  visitorId: string;
  name: string | null;
  email: string | null;
  isResolved: boolean;
  updatedAt: string;
  lastMessage: { content: string; sender: string } | null;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  sender: string;
  createdAt: string;
  isRead: boolean;
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "resolved">("all");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [deletingBulk, setDeletingBulk] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/admin/chat/sessions");
    if (res.ok) setSessions(await res.json());
  }, []);

  const fetchMessages = useCallback(async (sessionId: string) => {
    const res = await fetch(`/api/admin/chat/messages?sessionId=${sessionId}`);
    if (res.ok) {
      setMessages(await res.json());
      fetchSessions();
    }
  }, [fetchSessions]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  useEffect(() => {
    if (!selectedId) return;
    fetchMessages(selectedId);
    const interval = setInterval(() => fetchMessages(selectedId), 10000);
    return () => clearInterval(interval);
  }, [selectedId, fetchMessages]);

  // Scroll to bottom only when opening a new dialog, not on every update
  const prevSelectedId = useRef<string | null>(null);
  useEffect(() => {
    if (selectedId !== prevSelectedId.current) {
      prevSelectedId.current = selectedId;
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [selectedId, messages]);

  const handleSend = async () => {
    if (!selectedId || !reply.trim() || sending) return;
    setSending(true);
    const res = await fetch("/api/admin/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: selectedId, content: reply.trim() }),
    });
    if (res.ok) {
      setReply("");
      await fetchMessages(selectedId);
    }
    setSending(false);
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Удалить диалог? Все сообщения будут удалены.")) return;
    await fetch("/api/admin/chat/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (selectedId === sessionId) setSelectedId(null);
    setCheckedIds((prev) => { const next = new Set(prev); next.delete(sessionId); return next; });
    await fetchSessions();
  };

  const handleBulkDelete = async () => {
    if (checkedIds.size === 0) return;
    if (!confirm(`Удалить ${checkedIds.size} диалог(ов)? Все сообщения будут удалены.`)) return;
    setDeletingBulk(true);
    await Promise.all(
      Array.from(checkedIds).map((id) =>
        fetch("/api/admin/chat/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: id }),
        })
      )
    );
    if (selectedId && checkedIds.has(selectedId)) setSelectedId(null);
    setCheckedIds(new Set());
    setDeletingBulk(false);
    await fetchSessions();
  };

  const handleResolve = async (sessionId: string, current: boolean) => {
    await fetch("/api/admin/chat/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, isResolved: !current }),
    });
    await fetchSessions();
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === "unread") return s.unreadCount > 0;
    if (filter === "resolved") return s.isResolved;
    return true;
  });

  const allChecked =
    filteredSessions.length > 0 &&
    filteredSessions.every((s) => checkedIds.has(s.id));

  const toggleCheckAll = () => {
    if (allChecked) {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        filteredSessions.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        filteredSessions.forEach((s) => next.add(s.id));
        return next;
      });
    }
  };

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalUnread = sessions.reduce((acc, s) => acc + s.unreadCount, 0);
  const selected = sessions.find((s) => s.id === selectedId);

  return (
    <>
      <header className="bg-white border-b border-neutral-100 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#111827]">Чат с пользователями</h1>
          <p className="text-xs text-neutral-400 font-bold mt-0.5">{sessions.length} диалогов{totalUnread > 0 ? ` · ${totalUnread} непрочитанных` : ""}</p>
        </div>
      </header>

      <div className="flex h-[calc(100vh-81px)]">
        {/* Left: session list */}
        <div className="w-[320px] border-r border-neutral-100 flex flex-col bg-white flex-shrink-0">
          {/* Filter tabs */}
          <div className="flex border-b border-neutral-100 px-3 pt-3 gap-1">
            {(([["all", "Все"], ["unread", "Непрочитанные"], ["resolved", "Закрытые"]] as [string, string][])).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val as "all" | "unread" | "resolved")}
                className={cn(
                  "px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all mb-2",
                  filter === val ? "bg-[#111827] text-white" : "text-neutral-400 hover:text-[#111827]"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Bulk action bar */}
          {filteredSessions.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-100 bg-neutral-50/60">
              {/* Select all checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleCheckAll}
                  className="w-3.5 h-3.5 accent-[#111827] cursor-pointer"
                />
                <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">
                  {allChecked ? "Снять все" : "Выбрать все"}
                </span>
              </label>

              {/* Delete selected button */}
              {checkedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={deletingBulk}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-[11px] font-black hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-red-200"
                >
                  <Trash2 size={11} />
                  Удалить ({checkedIds.size})
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {filteredSessions.length === 0 ? (
              <div className="py-16 text-center text-neutral-300">
                <MessageSquare size={32} className="mx-auto mb-2" />
                <p className="text-sm font-bold">Нет диалогов</p>
              </div>
            ) : (
              filteredSessions.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "relative group/session border-b border-neutral-50 transition-all hover:bg-neutral-50 flex items-stretch",
                    selectedId === s.id ? "bg-primary/5 border-l-2 border-l-primary" : "",
                    checkedIds.has(s.id) ? "bg-red-50/40" : ""
                  )}
                >
                  {/* Checkbox column */}
                  <div
                    className="flex items-center justify-center px-3 cursor-pointer flex-shrink-0"
                    onClick={(e) => toggleCheck(s.id, e)}
                  >
                    <input
                      type="checkbox"
                      checked={checkedIds.has(s.id)}
                      onChange={() => {}}
                      onClick={(e) => toggleCheck(s.id, e)}
                      className="w-3.5 h-3.5 accent-red-500 cursor-pointer"
                    />
                  </div>

                  {/* Session info button */}
                  <button
                    onClick={() => setSelectedId(s.id)}
                    className="flex-1 text-left pr-10 py-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-black text-neutral-400 flex-shrink-0">
                          {(s.name ?? s.visitorId.slice(0, 2)).toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black text-[#111827] truncate">{s.name ?? `Гость ${s.visitorId.slice(0, 8)}`}</p>
                            {s.visitorId.startsWith("ai_") && (
                              <span className="flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-600">🤖 AI</span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 font-bold truncate mt-0.5">
                            {s.lastMessage?.content ?? "Нет сообщений"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="text-[9px] text-neutral-300 font-bold whitespace-nowrap">
                          {formatDistanceToNow(new Date(s.updatedAt), { locale: ru, addSuffix: true })}
                        </p>
                        {s.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center">
                            {s.unreadCount}
                          </span>
                        )}
                        {s.isResolved && (
                          <CheckCircle size={12} className="text-green-400" />
                        )}
                      </div>
                    </div>
                  </button>


                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: chat view */}
        <div className="flex-1 flex flex-col">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageSquare size={48} className="mx-auto mb-3 text-neutral-200" />
                <p className="text-neutral-400 font-bold">Выберите диалог</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-[#111827]">{selected?.name ?? `Гость ${selected?.visitorId.slice(0, 8)}`}</p>
                    {selected?.visitorId.startsWith("ai_") && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-violet-100 text-violet-600">🤖 ИИ-диалог</span>
                    )}
                  </div>
                  {selected?.email && <p className="text-xs text-neutral-400 font-bold">{selected.email}</p>}
                </div>
                <button
                  onClick={() => selected && handleResolve(selected.id, selected.isResolved)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
                    selected?.isResolved
                      ? "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  )}
                >
                  {selected?.isResolved ? <Circle size={13} /> : <CheckCircle size={13} />}
                  {selected?.isResolved ? "Открыть" : "Закрыть диалог"}
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-neutral-50/30">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-neutral-300 text-sm font-bold">Нет сообщений</div>
                ) : (
                  messages.map((msg, i) => {
                    const msgDate = new Date(msg.createdAt);
                    const prevDate = i > 0 ? new Date(messages[i - 1].createdAt) : null;
                    const isNewDay = !prevDate || msgDate.toDateString() !== prevDate.toDateString();
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    let dateLabel = msgDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
                    if (msgDate.toDateString() === today.toDateString()) dateLabel = "Сегодня";
                    else if (msgDate.toDateString() === yesterday.toDateString()) dateLabel = "Вчера";

                    return (
                      <div key={msg.id}>
                        {isNewDay && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-neutral-200" />
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">{dateLabel}</span>
                            <div className="flex-1 h-px bg-neutral-200" />
                          </div>
                        )}
                        <div className={cn("flex", msg.sender === "ADMIN" ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-bold",
                              msg.sender === "ADMIN"
                                ? "bg-primary text-white rounded-br-sm"
                                : "bg-white border border-neutral-100 text-[#111827] rounded-bl-sm shadow-sm"
                            )}
                          >
                            <p className="leading-relaxed">{msg.content}</p>
                            <p className={cn("text-[9px] mt-1 font-bold", msg.sender === "ADMIN" ? "text-white/60 text-right" : "text-neutral-300")}>
                              {msgDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              <div className="bg-white border-t border-neutral-100 px-6 py-4">
                <div className="flex gap-3 items-end">
                  <textarea
                    ref={textareaRef}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder="Написать ответ... (Enter — отправить, Shift+Enter — новая строка)"
                    rows={2}
                    className="flex-1 resize-none px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-bold text-[#111827] placeholder:text-neutral-300 outline-none focus:border-primary/30 focus:bg-white transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!reply.trim() || sending}
                    className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex-shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
