"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Target,
  RefreshCw,
  Plus,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Filter,
  Bot,
  Copy,
  Check,
  ChevronDown,
  Layers,
  Search,
  ArrowUpDown,
  Sparkles,
  Info,
  Server,
  Zap,
} from "lucide-react";

type Campaign = {
  Id: number;
  Name: string;
  State?: string;
  Status?: string;
  Type?: string;
};

type QueryRow = {
  CampaignId: number;
  CampaignName: string;
  AdGroupName: string;
  Query: string;
  Keyword?: string;
  Impressions: number;
  Clicks: number;
  Cost: number;
  Conversions: number;
  CostPerConversion: number;
};

type Suggestion = {
  phrase: string;
  reason: string;
  risk: "high" | "medium";
  clicks?: number;
  cost?: number;
};

type Account = {
  id: string;
  login: string;
  displayName?: string | null;
  createdAt: string;
  updatedAt?: string;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽`;
}

function dateValue(daysAgo: number) {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}

export default function YandexDirectAdminClient() {
  const searchParams = useSearchParams();
  const urlConnected = searchParams.get("yandexConnected");
  const urlError = searchParams.get("yandexError");

  // Date range
  const [dateFrom, setDateFrom] = useState(dateValue(29));
  const [dateTo, setDateTo] = useState(dateValue(0));
  const [activePreset, setActivePreset] = useState<string>("30d");

  // Accounts & Config
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [redirectUri, setRedirectUri] = useState("https://gameshop24.ru/api/yandex-direct/oauth/callback");
  const [mcpEndpoint, setMcpEndpoint] = useState("https://mcp.directassist.pro/mcp");

  // Data
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [rows, setRows] = useState<QueryRow[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [reportWarning, setReportWarning] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [criticLoading, setCriticLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(urlConnected ? "Аккаунт Яндекс Директа успешно подключен!" : "");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"queries" | "campaigns" | "audit" | "settings">("queries");
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedWords, setCopiedWords] = useState(false);
  const [copiedMcp, setCopiedMcp] = useState(false);

  // Manual Token Form
  const [manualToken, setManualToken] = useState("");
  const [manualLogin, setManualLogin] = useState("");
  const [manualName, setManualName] = useState("");
  const [tokenSubmitting, setTokenSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/admin/yandex-direct/accounts");
      if (!res.ok) return;
      const data = await res.json();
      setAccounts(data.accounts || []);
      setSelectedAccountId(data.selectedId || data.accounts?.[0]?.id || null);
      if (typeof data.oauthConfigured === "boolean") setOauthConfigured(data.oauthConfigured);
      if (data.redirectUri) setRedirectUri(data.redirectUri);
      if (data.mcpEndpoint) setMcpEndpoint(data.mcpEndpoint);
      return data;
    } catch {
      return null;
    }
  };

  const loadData = async (accId?: string | null) => {
    setLoading(true);
    setError("");
    setReportWarning(null);
    try {
      const targetId = accId !== undefined ? accId : selectedAccountId;
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (campaignId) params.set("campaignIds", campaignId);
      const res = await fetch(`/api/admin/yandex-direct?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить данные из Яндекс Директа");
      setCampaigns(data.campaigns || []);
      setRows(data.rows || []);
      if (data.reportWarning) setReportWarning(data.reportWarning);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts().then((accData) => {
      const currentId = accData?.selectedId || accData?.accounts?.[0]?.id || null;
      if (currentId || accData?.accounts?.length) {
        loadData(currentId);
      }
    });
  }, []);

  const handleSelectAccount = async (id: string) => {
    setSelectedAccountId(id);
    await fetch("/api/admin/yandex-direct/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadData(id);
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Вы уверены, что хотите отключить этот аккаунт?")) return;
    await fetch(`/api/admin/yandex-direct/accounts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const accData = await loadAccounts();
    const nextId = accData?.selectedId || accData?.accounts?.[0]?.id || null;
    if (nextId) {
      await loadData(nextId);
    } else {
      setCampaigns([]);
      setRows([]);
      setSelectedAccountId(null);
    }
  };

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      setTokenError("Введите OAuth токен");
      return;
    }
    setTokenSubmitting(true);
    setTokenError("");
    try {
      const res = await fetch("/api/admin/yandex-direct/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_token",
          token: manualToken.trim(),
          login: manualLogin.trim() || undefined,
          displayName: manualName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось сохранить токен");

      setManualToken("");
      setManualLogin("");
      setManualName("");
      setShowConnectModal(false);
      setSuccessMsg("Аккаунт успешно подключен и проверен!");

      const accData = await loadAccounts();
      const newId = data.account?.id || accData?.selectedId;
      setSelectedAccountId(newId);
      await loadData(newId);
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : "Ошибка при сохранении токена");
    } finally {
      setTokenSubmitting(false);
    }
  };

  const setPreset = (preset: "today" | "yesterday" | "7d" | "30d" | "90d") => {
    setActivePreset(preset);
    if (preset === "today") {
      setDateFrom(dateValue(0));
      setDateTo(dateValue(0));
    } else if (preset === "yesterday") {
      setDateFrom(dateValue(1));
      setDateTo(dateValue(1));
    } else if (preset === "7d") {
      setDateFrom(dateValue(6));
      setDateTo(dateValue(0));
    } else if (preset === "30d") {
      setDateFrom(dateValue(29));
      setDateTo(dateValue(0));
    } else if (preset === "90d") {
      setDateFrom(dateValue(89));
      setDateTo(dateValue(0));
    }
  };

  const runCritic = async () => {
    setCriticLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/yandex-direct/critic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Анализ не удался");
      setSuggestions(data.suggestions || []);
      setActiveTab("audit");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка анализа запросов");
    } finally {
      setCriticLoading(false);
    }
  };

  const copyNegativeKeywords = () => {
    if (!suggestions.length) return;
    const list = suggestions.map((s) => s.phrase).join("\n");
    navigator.clipboard.writeText(list);
    setCopiedWords(true);
    setTimeout(() => setCopiedWords(false), 2500);
  };

  const copyMcpConfig = () => {
    const config = JSON.stringify(
      {
        mcpServers: {
          directassist: {
            url: mcpEndpoint,
          },
        },
      },
      null,
      2
    );
    navigator.clipboard.writeText(config);
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2500);
  };

  // Metrics
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        impressions: acc.impressions + (row.Impressions || 0),
        clicks: acc.clicks + (row.Clicks || 0),
        cost: acc.cost + (row.Cost || 0),
        conversions: acc.conversions + (row.Conversions || 0),
      }),
      { impressions: 0, clicks: 0, cost: 0, conversions: 0 }
    );
  }, [rows]);

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgCpc = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
  const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : 0;

  // Filtered Rows
  const filteredRows = useMemo(() => {
    if (!searchFilter.trim()) return rows;
    const q = searchFilter.toLowerCase();
    return rows.filter(
      (r) =>
        r.Query.toLowerCase().includes(q) ||
        r.CampaignName.toLowerCase().includes(q) ||
        r.AdGroupName.toLowerCase().includes(q)
    );
  }, [rows, searchFilter]);

  // Waste spend
  const wastedCost = useMemo(() => {
    return rows
      .filter((r) => r.Conversions === 0 && r.Cost > 0)
      .reduce((sum, r) => sum + r.Cost, 0);
  }, [rows]);

  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  return (
    <div className="space-y-6">
      {/* Top Banner Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={20} />
            <p className="text-sm font-black">{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            Закрыть
          </button>
        </div>
      )}

      {urlError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 text-amber-600 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-black">
                {urlError === "missing_client_id"
                  ? "Для входа через OAuth нужно указать YANDEX_DIRECT_CLIENT_ID на сервере."
                  : urlError === "token_exchange"
                  ? "Не удалось обменять код на токен авторизации Яндекса."
                  : "Ошибка авторизации через Яндекс OAuth."}
              </p>
              <p className="mt-1 text-xs font-bold text-amber-700">
                Вы можете моментально подключить любой аккаунт по прямому OAuth-токену без настроек приложения в Яндексе! Нажмите кнопку «Подключить аккаунт» ниже.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Target size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#111827]">Яндекс Директ</h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                API v5
              </span>
            </div>
            <p className="mt-0.5 text-xs font-bold text-neutral-400">
              Подключение кабинетов, выгрузка кампаний, поисковые запросы и аудит минус-слов
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={loading || !accounts.length}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-black text-[#111827] shadow-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Загрузка…" : "Обновить"}
          </button>

          <button
            onClick={() => setShowConnectModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-white shadow-md shadow-primary/20 hover:opacity-95"
          >
            <Plus size={15} />
            Подключить аккаунт
          </button>
        </div>
      </div>

      {/* Account Switcher Bar */}
      {accounts.length > 0 ? (
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-[#111827] font-black text-sm">
                Я
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-[#111827]">
                    {activeAccount?.displayName || activeAccount?.login}
                  </p>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Активен
                  </span>
                </div>
                <p className="text-xs font-bold text-neutral-400">Логин: {activeAccount?.login}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {accounts.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-neutral-400">Сменить:</span>
                  <select
                    value={activeAccount?.id}
                    onChange={(e) => handleSelectAccount(e.target.value)}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-black text-[#111827]"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.displayName || acc.login} ({acc.login})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => activeAccount && handleDeleteAccount(activeAccount.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50"
              >
                <Trash2 size={13} />
                Отключить
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state: No accounts connected */
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-primary">
            <Key size={30} />
          </div>
          <h2 className="mt-4 text-xl font-black text-[#111827]">Подключите рекламный аккаунт Яндекс Директа</h2>
          <p className="mx-auto mt-2 max-w-xl text-xs font-bold leading-relaxed text-neutral-500">
            Поддерживаются любые клиентские и агентские аккаунты. Вы можете моментально подключить аккаунт по прямому OAuth-токену или через стандартный вход Яндекса.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-black text-white shadow-lg shadow-primary/20 hover:opacity-95"
            >
              <Plus size={15} />
              Подключить аккаунт прямо сейчас
            </button>
          </div>
        </div>
      )}

      {/* Date Range & Campaign Filters */}
      {accounts.length > 0 && (
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mr-1">Период:</span>
              {[
                { id: "today", label: "Сегодня" },
                { id: "yesterday", label: "Вчера" },
                { id: "7d", label: "7 дней" },
                { id: "30d", label: "30 дней" },
                { id: "90d", label: "90 дней" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                    activePreset === p.id
                      ? "bg-[#111827] text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* AI Critic Trigger */}
            <button
              onClick={runCritic}
              disabled={criticLoading || !rows.length}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-200 hover:opacity-95 disabled:opacity-40"
            >
              <Sparkles size={14} className={criticLoading ? "animate-spin" : ""} />
              {criticLoading ? "Анализируем запросы…" : "ИИ-Аудит минус-слов"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end border-t border-neutral-100 pt-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">С даты</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setActivePreset("custom");
                }}
                className="mt-1.5 block w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-[#111827]"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">По дату</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setActivePreset("custom");
                }}
                className="mt-1.5 block w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-[#111827]"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Кампания</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-[#111827]"
              >
                <option value="">Все кампании ({campaigns.length})</option>
                {campaigns.map((c) => (
                  <option key={c.Id} value={c.Id}>
                    {c.Name} (ID: {c.Id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadData()}
              disabled={loading}
              className="inline-flex h-[38px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-black text-white hover:opacity-95 disabled:opacity-50"
            >
              <Filter size={14} />
              Применить
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Расход</p>
            <p className="mt-2 text-2xl font-black text-[#111827]">{formatMoney(totals.cost)}</p>
            {wastedCost > 0 && (
              <p className="mt-1 text-[11px] font-bold text-red-500">
                Впустую (0 конв.): {formatMoney(wastedCost)}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Клики & CPC</p>
            <p className="mt-2 text-2xl font-black text-[#111827]">{totals.clicks.toLocaleString("ru-RU")}</p>
            <p className="mt-1 text-[11px] font-bold text-neutral-400">
              Средняя цена клика: <span className="text-[#111827] font-black">{formatMoney(avgCpc)}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Показы & CTR</p>
            <p className="mt-2 text-2xl font-black text-[#111827]">{totals.impressions.toLocaleString("ru-RU")}</p>
            <p className="mt-1 text-[11px] font-bold text-neutral-400">
              Кликабельность CTR: <span className="text-[#111827] font-black">{ctr.toFixed(2)}%</span>
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Конверсии & CPA</p>
            <p className="mt-2 text-2xl font-black text-emerald-600">{totals.conversions.toLocaleString("ru-RU")}</p>
            <p className="mt-1 text-[11px] font-bold text-neutral-400">
              Цена конверсии: <span className="text-[#111827] font-black">{totals.conversions ? formatMoney(cpa) : "—"}</span>
            </p>
          </div>
        </div>
      )}

      {/* Warnings & Errors */}
      {reportWarning && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs font-bold text-amber-800">
          <Info size={16} className="text-amber-600 flex-shrink-0" />
          <span>{reportWarning}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-xs font-bold text-red-800">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      {accounts.length > 0 && (
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
          <button
            onClick={() => setActiveTab("queries")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
              activeTab === "queries"
                ? "bg-[#111827] text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Search size={14} />
            Поисковые запросы ({rows.length})
          </button>

          <button
            onClick={() => setActiveTab("campaigns")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
              activeTab === "campaigns"
                ? "bg-[#111827] text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Layers size={14} />
            Кампании ({campaigns.length})
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
              activeTab === "audit"
                ? "bg-purple-600 text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Bot size={14} />
            Аудит и Минус-слова {suggestions.length > 0 && `(${suggestions.length})`}
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
              activeTab === "settings"
                ? "bg-[#111827] text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Server size={14} />
            Интеграция & MCP
          </button>
        </div>
      )}

      {/* TAB 1: Search Queries */}
      {accounts.length > 0 && activeTab === "queries" && (
        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-neutral-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Фильтр по фразе или кампании…"
                className="w-full rounded-xl border border-neutral-200 py-2 pl-9 pr-4 text-xs font-bold text-[#111827] placeholder:text-neutral-400"
              />
            </div>
            <p className="text-xs font-bold text-neutral-400">
              Показано: <span className="font-black text-[#111827]">{filteredRows.length}</span> из {rows.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  {["Поисковый запрос", "Кампания", "Группа", "Показы", "Клики", "CTR", "Расход", "Конверсии", "CPA"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-5 py-3.5 text-[9px] font-black uppercase tracking-wider text-neutral-400"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {[...filteredRows]
                  .sort((a, b) => b.Cost - a.Cost)
                  .slice(0, 200)
                  .map((row, i) => {
                    const rowCtr = row.Impressions > 0 ? (row.Clicks / row.Impressions) * 100 : 0;
                    const isWaste = row.Cost >= 250 && row.Conversions === 0;
                    return (
                      <tr key={`${row.Query}-${i}`} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="max-w-[280px] px-5 py-3.5">
                          <p className="text-xs font-black text-[#111827] break-words">{row.Query || "—"}</p>
                          {row.Keyword && row.Keyword !== row.Query && (
                            <p className="text-[10px] font-bold text-neutral-400 truncate">Ключ: {row.Keyword}</p>
                          )}
                        </td>
                        <td className="max-w-[180px] truncate px-5 py-3.5 text-xs font-bold text-neutral-600">
                          {row.CampaignName || "—"}
                        </td>
                        <td className="max-w-[160px] truncate px-5 py-3.5 text-xs font-bold text-neutral-500">
                          {row.AdGroupName || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-neutral-600">{row.Impressions}</td>
                        <td className="px-5 py-3.5 text-xs font-black text-[#111827]">{row.Clicks}</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-neutral-600">{rowCtr.toFixed(1)}%</td>
                        <td className="px-5 py-3.5 text-xs font-black">
                          <span className={isWaste ? "text-red-600" : "text-primary"}>
                            {formatMoney(row.Cost)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-neutral-700">
                          {row.Conversions > 0 ? (
                            <span className="font-black text-emerald-600">{row.Conversions}</span>
                          ) : (
                            <span className="text-neutral-300">0</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-neutral-600">
                          {row.CostPerConversion ? formatMoney(row.CostPerConversion) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-xs font-bold text-neutral-400">
                      {rows.length === 0
                        ? "Нет данных за выбранный диапазон дат. Попробуйте выбрать более широкий период."
                        : "По вашему запросу ничего не найдено."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Campaigns */}
      {accounts.length > 0 && activeTab === "campaigns" && (
        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
          <div className="border-b border-neutral-100 p-5">
            <h3 className="text-sm font-black text-[#111827]">Рекламные кампании в кабинете</h3>
            <p className="mt-0.5 text-xs font-bold text-neutral-400">
              Список кампаний, статус показов и настройки
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  {["ID", "Название кампании", "Тип", "Статус", "Действие"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {campaigns.map((c) => {
                  const isActive = c.State === "ON";
                  return (
                    <tr key={c.Id} className="hover:bg-neutral-50/50">
                      <td className="px-5 py-4 text-xs font-bold text-neutral-400">{c.Id}</td>
                      <td className="px-5 py-4 text-xs font-black text-[#111827]">{c.Name}</td>
                      <td className="px-5 py-4 text-xs font-bold text-neutral-500">{c.Type || "TEXT_CAMPAIGN"}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                            isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {c.State || "ACTIVE"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => {
                            setCampaignId(String(c.Id));
                            setActiveTab("queries");
                            loadData();
                          }}
                          className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-black text-[#111827] hover:bg-neutral-200"
                        >
                          Отчет по запросам
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-xs font-bold text-neutral-400">
                      Кампании не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Audit & Negative Keywords */}
      {accounts.length > 0 && activeTab === "audit" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="text-purple-600" size={20} />
                <h3 className="text-base font-black text-[#111827]">Аудит запросов и рекомендации минус-слов</h3>
              </div>
              <p className="mt-1 text-xs font-bold text-neutral-600">
                ИИ и алгоритмы выявляют нерелевантный трафик, некоммерческие запросы и слив бюджета без конверсий.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={runCritic}
                disabled={criticLoading || !rows.length}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-purple-200 hover:bg-purple-700 disabled:opacity-50"
              >
                <Sparkles size={14} className={criticLoading ? "animate-spin" : ""} />
                {criticLoading ? "Анализируем…" : "Запустить аудит"}
              </button>

              {suggestions.length > 0 && (
                <button
                  onClick={copyNegativeKeywords}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-black text-[#111827] shadow-sm hover:bg-neutral-50"
                >
                  {copiedWords ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedWords ? "Скопировано!" : `Скопировать слова (${suggestions.length})`}
                </button>
              )}
            </div>
          </div>

          {suggestions.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
              <div className="divide-y divide-neutral-100">
                {suggestions.map((item, idx) => (
                  <div key={`${item.phrase}-${idx}`} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-xl">
                      <p className="text-sm font-black text-[#111827]">{item.phrase}</p>
                      <p className="mt-1 text-xs font-bold text-neutral-500 leading-relaxed">{item.reason}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {(item.cost || item.clicks) && (
                        <div className="text-right">
                          <p className="text-xs font-black text-[#111827]">
                            {item.cost ? formatMoney(item.cost) : "0 ₽"}
                          </p>
                          <p className="text-[10px] font-bold text-neutral-400">{item.clicks || 0} кликов</p>
                        </div>
                      )}

                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                          item.risk === "high"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.risk === "high" ? "Высокий риск" : "Проверить"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-100 bg-white p-12 text-center shadow-sm">
              <Bot className="mx-auto text-purple-400" size={36} />
              <p className="mt-3 text-sm font-black text-[#111827]">Аудит еще не запущен</p>
              <p className="mt-1 text-xs font-bold text-neutral-400">
                Нажмите «Запустить аудит», чтобы проверить запросы на наличие нецелевого трафика.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Settings & MCP */}
      {accounts.length > 0 && activeTab === "settings" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* DirectAssist MCP Server card */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#111827]">DirectAssist MCP Сервер</h3>
                <p className="text-xs font-bold text-neutral-400">Model Context Protocol для ИИ</p>
              </div>
            </div>

            <p className="text-xs font-bold leading-relaxed text-neutral-600">
              Вы можете подключить этот рекламный кабинет к внешним ИИ-агентам (Claude Desktop, Cursor, Custom Agents) через сервер DirectAssist MCP:
            </p>

            <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-200">
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">MCP Endpoint</p>
              <p className="mt-1 font-mono text-xs font-bold text-[#111827] select-all break-all">{mcpEndpoint}</p>
            </div>

            <button
              onClick={copyMcpConfig}
              className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-black text-white hover:bg-neutral-800"
            >
              {copiedMcp ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiedMcp ? "JSON скопирован" : "Скопировать конфиг для MCP"}
            </button>
          </div>

          {/* OAuth Setup & Redirect URI Card */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#111827]">Параметры OAuth интеграции</h3>
                <p className="text-xs font-bold text-neutral-400">Настройки сервера и перенаправления</p>
              </div>
            </div>

            <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-200">
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Redirect URI</p>
              <p className="mt-1 font-mono text-xs font-bold text-[#111827] select-all break-all">{redirectUri}</p>
            </div>

            <div className="space-y-1.5 text-xs font-bold text-neutral-600">
              <div className="flex items-center justify-between">
                <span>OAuth Client ID:</span>
                <span className={oauthConfigured ? "text-emerald-600 font-black" : "text-amber-600 font-black"}>
                  {oauthConfigured ? "Настроен" : "Не настроен (используйте подключение по токену)"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Direct API Endpoint:</span>
                <span className="text-[#111827] font-mono">https://api.direct.yandex.com/json/v501</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONNECT ACCOUNT MODAL / POPUP */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-base font-black text-[#111827]">Подключение аккаунта Яндекс Директа</h3>
                <p className="text-xs font-bold text-neutral-400">Любой личный или агентский кабинет</p>
              </div>
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  setTokenError("");
                }}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-[#111827]"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-6">
              {/* Option 1: Manual Token */}
              <form onSubmit={handleManualTokenSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                    1
                  </span>
                  <p className="text-xs font-black uppercase tracking-wider text-[#111827]">
                    Быстрое подключение по OAuth-токену (Рекомендуется)
                  </p>
                </div>

                <p className="text-xs font-bold text-neutral-500 leading-relaxed">
                  Позволяет моментально привязать <strong>любой аккаунт</strong> без создания приложения в Яндексе.
                </p>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    OAuth Access Token *
                  </label>
                  <input
                    type="password"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="y0_AgAAAA..."
                    className="mt-1.5 block w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 font-mono text-xs font-bold text-[#111827]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      Логин в Яндексе (опционально)
                    </label>
                    <input
                      type="text"
                      value={manualLogin}
                      onChange={(e) => setManualLogin(e.target.value)}
                      placeholder="direct-client-login"
                      className="mt-1.5 block w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-[#111827]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      Понятное имя (опционально)
                    </label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Nintendo Switch Shop"
                      className="mt-1.5 block w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-[#111827]"
                    />
                  </div>
                </div>

                {tokenError && (
                  <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700">
                    {tokenError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={tokenSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-black text-white hover:opacity-95 disabled:opacity-50"
                >
                  {tokenSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                  {tokenSubmitting ? "Проверяем токен в API…" : "Проверить и сохранить аккаунт"}
                </button>
              </form>

              {/* Option 2: OAuth button */}
              <div className="border-t border-neutral-100 pt-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-black text-neutral-700">
                    2
                  </span>
                  <p className="text-xs font-black uppercase tracking-wider text-[#111827]">
                    Или подключить через Яндекс OAuth
                  </p>
                </div>

                <a
                  href="/api/admin/yandex-direct/oauth/start"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 py-3 text-xs font-black text-[#111827] hover:bg-neutral-100"
                >
                  <ExternalLink size={14} />
                  Авторизоваться через Яндекс OAuth
                </a>

                <p className="text-[11px] font-bold text-neutral-400 leading-relaxed text-center">
                  Redirect URI приложения: <span className="font-mono text-[#111827]">{redirectUri}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
