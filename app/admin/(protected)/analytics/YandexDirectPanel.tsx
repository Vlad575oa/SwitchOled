"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, ExternalLink, Filter, RefreshCw, ShieldCheck } from "lucide-react";

type Campaign = { Id: number; Name: string; State?: string; Status?: string };
type QueryRow = {
  CampaignId: number; CampaignName: string; AdGroupName: string; Query: string;
  Impressions: number; Clicks: number; Cost: number; Conversions: number; CostPerConversion: number;
};
type Suggestion = { phrase: string; reason: string; risk: "high" | "medium"; clicks?: number; cost?: number };
type Account = { id: string; login: string; displayName?: string | null };

function money(value: number) { return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`; }
function dateValue(daysAgo: number) { return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10); }

export default function YandexDirectPanel() {
  const [dateFrom, setDateFrom] = useState(dateValue(29));
  const [dateTo, setDateTo] = useState(dateValue(0));
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [rows, setRows] = useState<QueryRow[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [criticLoading, setCriticLoading] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);

  const loadAccounts = async () => {
    const response = await fetch("/api/admin/yandex-direct/accounts");
    if (!response.ok) return;
    const data = await response.json();
    setAccounts(data.accounts || []);
    setSelectedAccountId(data.selectedId || null);
  };

  const load = async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (campaignId) params.set("campaignIds", campaignId);
      const response = await fetch(`/api/admin/yandex-direct?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось загрузить данные");
      setConfigured(data.configured || accounts.length > 0);
      setCampaigns(data.campaigns || []);
      setRows(data.rows || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка загрузки"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAccounts().then(load); }, []);

  const selectAccount = async (id: string) => {
    await fetch("/api/admin/yandex-direct/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setSelectedAccountId(id); setShowAccounts(false); await load();
  };

  const deleteAccount = async (id: string) => {
    await fetch(`/api/admin/yandex-direct/accounts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadAccounts();
    if (selectedAccountId === id) { setSelectedAccountId(null); setConfigured(false); }
  };

  const totals = useMemo(() => rows.reduce((acc, row) => ({
    impressions: acc.impressions + row.Impressions,
    clicks: acc.clicks + row.Clicks,
    cost: acc.cost + row.Cost,
    conversions: acc.conversions + row.Conversions,
  }), { impressions: 0, clicks: 0, cost: 0, conversions: 0 }), [rows]);

  const runCritic = async () => {
    setCriticLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/yandex-direct/critic", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ИИ-критик не ответил");
      setSuggestions(data.suggestions || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка ИИ-критика"); }
    finally { setCriticLoading(false); }
  };

  return (
    <section className="mt-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><h2 className="text-xl font-black text-[#111827]">Яндекс Директ</h2><p className="text-xs text-neutral-400 font-bold mt-1">Кампании, запросы, клики и конверсии</p></div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} />Обновить</button>
      </div>

      {configured === false && <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center shadow-sm"><ShieldCheck className="mx-auto mb-4 text-[#3158f5]" size={32} /><h3 className="text-2xl font-black text-[#111827]">Подключите рекламный кабинет</h3><p className="mx-auto mt-3 max-w-3xl text-sm font-bold leading-relaxed text-slate-500">Подключите аккаунт Яндекса с правами на Яндекс.Директ — и здесь появятся кампании, ключевые слова, отчёты и инструменты аналитики.</p><a href="/api/admin/yandex-direct/oauth/start" className="mx-auto mt-6 inline-flex items-center justify-center rounded-xl bg-[#3158f5] px-8 py-4 text-sm font-black text-white shadow-lg shadow-blue-200">Подключить через Яндекс OAuth</a><p className="mt-4 text-[11px] font-bold text-slate-400">Нужно один раз настроить YANDEX_DIRECT_CLIENT_ID и YANDEX_DIRECT_CLIENT_SECRET на сервере.</p></div>}

      {configured !== false && <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Подключение Я.Директа</p><p className="mt-1 text-sm font-black text-[#111827]">{accounts.find((account) => account.id === selectedAccountId)?.displayName || accounts.find((account) => account.id === selectedAccountId)?.login || "Аккаунт из переменных окружения"}</p></div><button onClick={() => setShowAccounts((value) => !value)} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-black text-[#111827]">Сменить аккаунт</button></div>{showAccounts && <div className="mt-5 space-y-3 border-t border-neutral-100 pt-5"><p className="text-sm font-black text-[#111827]">Подключённые аккаунты</p>{accounts.map((account) => <div key={account.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"><div><p className="text-sm font-black text-[#111827]">{account.displayName || account.login}</p><p className="text-xs font-bold text-neutral-400">{account.login}</p></div><div className="flex items-center gap-2"><button onClick={() => selectAccount(account.id)} className="rounded-lg bg-[#3158f5] px-3 py-2 text-xs font-black text-white">Использовать</button><button onClick={() => deleteAccount(account.id)} className="rounded-lg px-2 py-2 text-xs font-black text-red-500">Удалить</button></div></div>)}<a href="/api/admin/yandex-direct/oauth/start" className="inline-flex rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-xs font-black text-[#111827]">＋ Подключить новый аккаунт</a></div>}</div>}

      {configured && <>
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_1.5fr_auto] md:items-end">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">С даты<input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-2 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-bold text-[#111827]" /></label>
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">По дату<input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-2 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-bold text-[#111827]" /></label>
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Кампания<select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="mt-2 block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-bold text-[#111827]"><option value="">Все кампании</option>{campaigns.map((campaign) => <option key={campaign.Id} value={campaign.Id}>{campaign.Name}</option>)}</select></label>
          <button onClick={load} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-black text-white disabled:opacity-50"><Filter size={14} />Показать</button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Показы" value={totals.impressions.toLocaleString("ru-RU")} /><Metric label="Клики" value={totals.clicks.toLocaleString("ru-RU")} /><Metric label="Расход" value={money(totals.cost)} /><Metric label="Конверсии" value={totals.conversions.toLocaleString("ru-RU")} /></div>

        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4"><div><h3 className="text-sm font-black text-[#111827]">Поисковые запросы и ключевые слова</h3><p className="mt-1 text-[11px] font-bold text-neutral-400">Сортировка по расходу · {rows.length} строк</p></div><button onClick={runCritic} disabled={criticLoading || !rows.length} className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Bot size={15} />{criticLoading ? "Критик проверяет…" : "ИИ-критик минус-слов"}</button></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-neutral-50"><tr>{["Запрос", "Кампания", "Группа", "Показы", "Клики", "Расход", "Конверсии", "Цена конверсии"].map((item) => <th key={item} className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-neutral-400">{item}</th>)}</tr></thead><tbody>{[...rows].sort((a, b) => b.Cost - a.Cost).slice(0, 300).map((row, index) => <tr key={`${row.Query}-${index}`} className="border-t border-neutral-100"><td className="max-w-[260px] px-5 py-3 text-xs font-black text-[#111827]">{row.Query || "—"}</td><td className="max-w-[180px] truncate px-5 py-3 text-xs font-bold text-neutral-600">{row.CampaignName || "—"}</td><td className="max-w-[160px] truncate px-5 py-3 text-xs font-bold text-neutral-500">{row.AdGroupName || "—"}</td><td className="px-5 py-3 text-xs font-bold text-neutral-600">{row.Impressions}</td><td className="px-5 py-3 text-xs font-black text-[#111827]">{row.Clicks}</td><td className="px-5 py-3 text-xs font-black text-primary">{money(row.Cost)}</td><td className="px-5 py-3 text-xs font-bold text-neutral-600">{row.Conversions}</td><td className="px-5 py-3 text-xs font-bold text-neutral-600">{row.CostPerConversion ? money(row.CostPerConversion) : "—"}</td></tr>)}{!rows.length && <tr><td colSpan={8} className="px-5 py-12 text-center text-sm font-bold text-neutral-400">Нет данных за выбранный период</td></tr>}</tbody></table></div></div>

        {suggestions.length > 0 && <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm"><div className="border-b border-red-100 bg-red-50 px-5 py-4"><h3 className="flex items-center gap-2 text-sm font-black text-red-900"><Bot size={16} />Кандидаты в минус-слова</h3><p className="mt-1 text-[11px] font-bold text-red-700">Это рекомендации критика. Проверьте смысл запроса и добавляйте слова в Директе вручную.</p></div><div className="divide-y divide-neutral-100">{suggestions.map((item, index) => <div key={`${item.phrase}-${index}`} className="grid gap-2 px-5 py-4 md:grid-cols-[1.2fr_2fr_auto]"><div><p className="text-sm font-black text-[#111827]">{item.phrase}</p><p className="mt-1 text-[11px] font-bold text-neutral-400">Кликов: {item.clicks ?? 0} · Расход: {money(item.cost ?? 0)}</p></div><p className="text-xs font-bold leading-relaxed text-neutral-600">{item.reason}</p><span className={`h-fit rounded-full px-2 py-1 text-[9px] font-black uppercase ${item.risk === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item.risk === "high" ? "Высокий риск" : "Проверить"}</span></div>)}</div></div>}
      </>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</p>}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{label}</p><p className="mt-2 text-2xl font-black text-[#111827]">{value}</p></div>;
}
