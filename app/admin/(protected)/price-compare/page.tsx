"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Upload, Loader2, RefreshCw, CheckCircle2, AlertCircle, Ban, BookOpen, ChevronLeft, ChevronRight, ArrowUpDown, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ComparePrice = {
  supplierSlug: string;
  supplierName: string;
  price: number | null;
  inStock: boolean;
};

type CompareGame = {
  gameId: number;
  name: string;
  platform: string;
  prices: ComparePrice[];
  minPrice: number | null;
  supplierCount: number;
};

type PendingEntry = {
  id: number;
  uploadId: number;
  rawName: string;
  platform: string | null;
  priceRetail: number | null;
  priceWholesale: number | null;
  upload: { supplier: { name: string } };
};

type GameOption = { id: number; canonicalName: string; platform: string };
type SupplierOption = { slug: string; name: string };
type AiSuggestion = {
  id: number;
  decision: "match" | "new" | "skip";
  gameId?: number;
  matchedName?: string | null;
  canonicalName?: string;
  confidence: number;
  reason?: string;
};

const PLATFORMS = ["Все", "PS4", "PS5", "SWITCH", "PSP", "XBOX"];
const SUPPLIER_COUNT_OPTIONS = [
  { label: "Все", value: null as number | null },
  { label: "У 4 поставщиков", value: 4 },
  { label: "У 3 поставщиков", value: 3 },
  { label: "У 2 поставщиков", value: 2 },
  { label: "Только у 1", value: 1 },
];

// Проверочный столбец: отдельный поставщик-эталон, который не участвует в автоопределении
// формата — файл в него загружается вручную через иконку в шапке, с явным выбором формата.
const VERIFICATION_SLUG = "proverka";
const FORMAT_OPTIONS = [
  { key: "amax", label: "AMAX" },
  { key: "katana", label: "Katana" },
  { key: "wholesale", label: "Оптовый Прайс" },
  { key: "games1c", label: "Прайс игры (1С)" },
  { key: "gameuae", label: "GameUAE" },
];

export default function PriceComparePage() {
  const [games, setGames] = useState<CompareGame[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [platform, setPlatform] = useState("Все");
  const [search, setSearch] = useState("");
  const [supplierCount, setSupplierCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<Record<number, AiSuggestion>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [sortBySupplier, setSortBySupplier] = useState<string | null>(null);
  const [sortByName, setSortByName] = useState<"asc" | "desc" | null>(null);
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  const fetchCompare = async (
    plat: string,
    pageArg: number,
    searchArg: string,
    supplierCountArg: number | null,
    sortSupplierArg?: string | null
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (plat !== "Все") params.set("platform", plat);
      if (searchArg.trim()) params.set("search", searchArg.trim());
      if (supplierCountArg != null) params.set("supplierCount", String(supplierCountArg));
      if (sortSupplierArg) params.set("sortSupplier", sortSupplierArg);
      params.set("page", String(pageArg));

      const res = await fetch(`/api/admin/price-compare?${params.toString()}`);
      const data = await res.json();
      setGames(data.games || []);
      setSuppliers(data.suppliers || []);
      setTotal(data.total || 0);
      setPageSize(data.pageSize || 50);
    } catch {
      toast.error("Не удалось загрузить сравнение цен");
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/admin/price-entries");
      const data = await res.json();
      setPending(data.entries || []);
    } catch {
      // тихо — это не критичный блок
    }
  };

  // Смена платформы/поиска/фильтра поставщиков сбрасывает на первую страницу.
  useEffect(() => {
    setPage(1);
  }, [platform, search, supplierCount, sortBySupplier]);

  // Поиск — с дебаунсом, чтобы не дёргать сервер на каждое нажатие клавиши.
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCompare(platform, page, search, supplierCount, sortBySupplier);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, search, supplierCount, page, sortBySupplier]);

  useEffect(() => {
    fetchPending();
  }, []);

  // Загрузка прайса — отдельная иконка у каждого столбца поставщика. Для обычных
  // поставщиков формат файла совпадает со slug'ом поставщика и известен заранее;
  // для проверочного столбца (эталон, может быть в любом формате) сначала спрашиваем формат.
  const openUploadFor = (slug: string) => {
    uploadTargetRef.current = slug;
    uploadFileInputRef.current?.click();
  };

  const handleFileChosen = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    const slug = uploadTargetRef.current;
    if (uploadFileInputRef.current) uploadFileInputRef.current.value = "";
    if (!file || !slug) return;

    if (slug === VERIFICATION_SLUG) {
      setPendingFile(file);
      return;
    }
    doUpload(file, slug, slug);
  };

  const doUpload = async (file: File, supplierSlug: string, parserKey: string) => {
    setUploadingSlug(supplierSlug);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("supplierSlug", supplierSlug);
      fd.append("parserKey", parserKey);
      const res = await fetch("/api/admin/price-uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(`${file.name}: ${data.message || data.error || "ошибка загрузки"}`);
      } else {
        toast.success(`${file.name}: загружено ${data.rowsTotal} позиций (${data.rowsMatched} сопоставлено, ${data.rowsPending} требуют проверки)`);
      }
    } catch {
      toast.error(`${file.name}: ошибка сервера`);
    } finally {
      setUploadingSlug(null);
      fetchCompare(platform, page, search, supplierCount, sortBySupplier);
      fetchPending();
    }
  };

  const uploadPendingFileWithFormat = (parserKey: string) => {
    if (!pendingFile) return;
    const file = pendingFile;
    setPendingFile(null);
    doUpload(file, VERIFICATION_SLUG, parserKey);
  };

  const confirmEntry = async (entryId: number, gameId: number | null, newGame?: { canonicalName: string; platform: string }) => {
    try {
      const res = await fetch(`/api/admin/price-entries/${entryId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameId ? { gameId } : { newGame }),
      });
      if (!res.ok) {
        toast.error("Не удалось подтвердить сопоставление");
        return;
      }
      toast.success("Сопоставлено");
      setPending((prev) => prev.filter((e) => e.id !== entryId));
      setAiSuggestions((prev) => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
      fetchCompare(platform, page, search, supplierCount, sortBySupplier);
    } catch {
      toast.error("Ошибка сервера");
    }
  };

  const rejectEntry = async (entryId: number) => {
    try {
      const res = await fetch(`/api/admin/price-entries/${entryId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reject: true }),
      });
      if (!res.ok) {
        toast.error("Не удалось отклонить строку");
        return;
      }
      setPending((prev) => prev.filter((e) => e.id !== entryId));
      setAiSuggestions((prev) => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
    } catch {
      toast.error("Ошибка сервера");
    }
  };

  const runAiMatch = async () => {
    if (pending.length === 0) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/price-entries/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryIds: pending.map((e) => e.id) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Не удалось разобрать позиции ИИ");
        return;
      }
      const map: Record<number, AiSuggestion> = {};
      for (const s of data.suggestions || []) map[s.id] = s;
      setAiSuggestions(map);
      toast.success(`ИИ предложил варианты для ${Object.keys(map).length} из ${pending.length} позиций`);
    } catch {
      toast.error("Ошибка сервера при ИИ-разборе");
    } finally {
      setAiLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const verifSupplier = suppliers.find((s) => s.slug === VERIFICATION_SLUG) || null;
  const regularSuppliers = suppliers.filter((s) => s.slug !== VERIFICATION_SLUG);
  const orderedSuppliers = verifSupplier ? [verifSupplier, ...regularSuppliers] : regularSuppliers;

  // Клик по поставщику в шапке сортирует список: сначала его позиции в наличии, потом остальные.
  // Клик по "Игра" — по алфавиту (по клику переключается направление). Оба вида сортировки
  // взаимоисключающие — включение одной сбрасывает другую.
  const displayedGames = sortByName
    ? [...games].sort((a, b) => a.name.localeCompare(b.name, "ru") * (sortByName === "asc" ? 1 : -1))
    : sortBySupplier
    ? [...games].sort((a, b) => {
        const aOk = a.prices.some((p) => p.supplierSlug === sortBySupplier && p.price != null && p.inStock) ? 0 : 1;
        const bOk = b.prices.some((p) => p.supplierSlug === sortBySupplier && p.price != null && p.inStock) ? 0 : 1;
        return aOk - bOk;
      })
    : games;

  return (
    <>
      <header className="bg-white border-b border-neutral-100 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#111827]">Сравнение цен на игры</h1>
          <p className="text-xs text-neutral-400 font-bold mt-0.5">Загрузите прайсы поставщиков и сравните минимальную цену</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/price-compare/games"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-sm font-black hover:bg-neutral-50 transition-colors"
          >
            <BookOpen size={15} />
            Справочник игр
          </Link>
          <input
            ref={uploadFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFileChosen(e.target.files)}
          />
          <button
            onClick={() => { fetchCompare(platform, page, search, supplierCount, sortBySupplier); fetchPending(); }}
            className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors"
            title="Обновить"
          >
            <RefreshCw size={15} className="text-neutral-500" />
          </button>
        </div>
      </header>

      {pendingFile && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#111827]">Формат файла</h3>
              <button onClick={() => setPendingFile(null)} className="p-1 hover:bg-neutral-50 rounded-lg transition-colors">
                <X size={16} className="text-neutral-400" />
              </button>
            </div>
            <p className="text-xs text-neutral-400 font-bold">
              {pendingFile.name} — выберите, в каком формате прочитать файл для проверочного столбца
            </p>
            <div className="space-y-2">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => uploadPendingFileWithFormat(f.key)}
                  className="w-full text-left px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-xs font-black text-neutral-600 transition-colors"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-8 space-y-6">
        {pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-amber-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle size={16} className="text-amber-600" />
                <h2 className="text-sm font-black text-amber-800">
                  {pending.length} позиций требуют подтверждения
                </h2>
              </div>
              <button
                type="button"
                onClick={runAiMatch}
                disabled={aiLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-black hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                Разобрать с ИИ
              </button>
            </div>
            <div className="divide-y divide-amber-100 max-h-96 overflow-y-auto">
              {pending.map((entry) => (
                <PendingRow
                  key={entry.id}
                  entry={entry}
                  suggestion={aiSuggestions[entry.id]}
                  onConfirm={confirmEntry}
                  onReject={rejectEntry}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
                  platform === p ? "bg-primary text-white" : "bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <select
            value={supplierCount == null ? "" : String(supplierCount)}
            onChange={(e) => setSupplierCount(e.target.value === "" ? null : Number(e.target.value))}
            className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-black text-neutral-500 outline-none focus:border-primary/40 transition-all cursor-pointer"
          >
            {SUPPLIER_COUNT_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value == null ? "" : String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию игры..."
            className="flex-1 min-w-[220px] px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-primary/40 transition-all"
          />

          {(search || supplierCount != null) && (
            <button
              onClick={() => { setSearch(""); setSupplierCount(null); }}
              className="px-3 py-2 text-xs font-black text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Сбросить
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center text-neutral-400">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : games.length === 0 ? (
            <div className="p-12 text-center text-sm text-neutral-400 font-bold">
              {total === 0 && page === 1 ? "Нет данных для сравнения — загрузите прайсы поставщиков" : "Ничего не найдено по текущим фильтрам"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-neutral-100">
                    <th className="text-right px-4 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400 w-12">№</th>
                    <th className="text-left px-6 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400">
                      <button
                        type="button"
                        onClick={() => {
                          setSortBySupplier(null);
                          setSortByName((prev) => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"));
                        }}
                        className={`flex items-center gap-1 hover:text-neutral-700 transition-colors ${
                          sortByName ? "text-primary" : ""
                        }`}
                      >
                        Игра
                        <ArrowUpDown size={11} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400">Платформа</th>
                    {orderedSuppliers.map((s) => (
                      <th key={s.slug} className="text-right px-4 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openUploadFor(s.slug)}
                            disabled={uploadingSlug === s.slug}
                            title={`Загрузить прайс для ${s.name}`}
                            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
                          >
                            {uploadingSlug === s.slug ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSortByName(null);
                              setSortBySupplier((prev) => (prev === s.slug ? null : s.slug));
                            }}
                            title="Сортировать: сначала в наличии у этого поставщика"
                            className={`flex items-center gap-1 hover:text-neutral-700 transition-colors ${
                              sortBySupplier === s.slug ? "text-primary" : ""
                            }`}
                          >
                            {s.name}
                            <ArrowUpDown size={11} />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {displayedGames.map((g, index) => (
                    <tr key={g.gameId} className="hover:bg-neutral-50/30">
                      <td className="px-4 py-3 text-right text-neutral-400 font-bold">{(page - 1) * pageSize + index + 1}</td>
                      <td className="px-6 py-3 font-bold text-[#111827]">{g.name}</td>
                      <td className="px-4 py-3 text-neutral-500 font-bold">{g.platform}</td>
                      {orderedSuppliers.map((s) => {
                        const entry = g.prices.find((p) => p.supplierSlug === s.slug);
                        const isMin = entry?.price != null && entry.price === g.minPrice;
                        return (
                          <td
                            key={s.slug}
                            className={`px-4 py-3 text-right font-bold ${
                              isMin ? "bg-green-100 text-green-800 rounded-lg" : "text-neutral-600"
                            }`}
                          >
                            {entry?.price != null ? (
                              <span className="inline-flex items-center gap-1 justify-end">
                                {isMin && <CheckCircle2 size={13} />}
                                {entry.price} ₽
                                {!entry.inStock && (
                                  <span title="Нет в наличии">
                                    <Ban size={12} className="text-neutral-400" />
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-neutral-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-neutral-400">
              Показано {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} из {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} className="text-neutral-500" />
              </button>
              <span className="text-xs font-black text-neutral-500 px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} className="text-neutral-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function PendingRow({
  entry,
  suggestion,
  onConfirm,
  onReject,
}: {
  entry: PendingEntry;
  suggestion?: AiSuggestion;
  onConfirm: (entryId: number, gameId: number | null, newGame?: { canonicalName: string; platform: string }) => void;
  onReject: (entryId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<GameOption[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<GameOption | null>(null);
  const [searching, setSearching] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Игру ищем по мере ввода отдельным запросом, а не держим весь справочник
  // (тысячи игр) в памяти каждой строки — иначе браузер зависает.
  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (query.trim()) params.set("search", query.trim());
        if (entry.platform) params.set("platform", entry.platform);
        const res = await fetch(`/api/admin/games?${params.toString()}`);
        const data = await res.json();
        setOptions(data.games || []);
      } catch {
        // тихо
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, open, entry.platform]);

  const openDropdown = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
    }
    setOpen(true);
  };

  const handlePick = (g: GameOption) => {
    setSelected(g);
    setQuery(`${g.canonicalName} (${g.platform})`);
    setOpen(false);
  };

  const handleConfirmNew = () => {
    onConfirm(entry.id, null, { canonicalName: entry.rawName, platform: entry.platform || "PS5" });
    setSelected(null);
    setQuery("");
  };

  const handleConfirmSelected = () => {
    if (!selected) return;
    onConfirm(entry.id, selected.id);
    setSelected(null);
    setQuery("");
  };

  return (
    <div className="p-4 flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-[240px]">
        <p className="font-bold text-[#111827] text-sm">{entry.rawName}</p>
        <p className="text-xs text-neutral-400 font-bold mt-0.5">
          {entry.upload.supplier.name} · {entry.platform || "платформа неизвестна"} · {entry.priceWholesale ?? entry.priceRetail ?? "—"} ₽
        </p>
        {suggestion && (
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {suggestion.decision === "match" && suggestion.gameId && (
              <>
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  ИИ: {suggestion.matchedName ?? `игра #${suggestion.gameId}`} ({Math.round(suggestion.confidence * 100)}%)
                </span>
                <button
                  type="button"
                  onClick={() => onConfirm(entry.id, suggestion.gameId!)}
                  className="text-[11px] font-black text-primary hover:underline"
                >
                  Принять
                </button>
              </>
            )}
            {suggestion.decision === "new" && suggestion.canonicalName && (
              <>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  ИИ: новая игра «{suggestion.canonicalName}» ({Math.round(suggestion.confidence * 100)}%)
                </span>
                <button
                  type="button"
                  onClick={() => onConfirm(entry.id, null, { canonicalName: suggestion.canonicalName!, platform: entry.platform || "PS5" })}
                  className="text-[11px] font-black text-emerald-700 hover:underline"
                >
                  Принять
                </button>
              </>
            )}
            {suggestion.decision === "skip" && (
              <>
                <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                  ИИ: похоже, не игра{suggestion.reason ? ` — ${suggestion.reason}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => onReject(entry.id)}
                  className="text-[11px] font-black text-neutral-500 hover:underline"
                >
                  Убрать из очереди
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="w-64">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            openDropdown();
          }}
          onFocus={openDropdown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Начните вводить название игры..."
          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-primary/40"
        />
      </div>

      {open && dropdownRect &&
        createPortal(
          <div
            style={{ position: "absolute", top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
            className="z-50 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-56 overflow-y-auto"
          >
            {searching ? (
              <div className="p-3 text-xs text-neutral-400 font-bold">Поиск...</div>
            ) : options.length === 0 ? (
              <div className="p-3 text-xs text-neutral-400 font-bold">Ничего не найдено</div>
            ) : (
              options.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onMouseDown={() => handlePick(g)}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-[#111827] hover:bg-neutral-50 transition-colors"
                >
                  {g.canonicalName} ({g.platform})
                </button>
              ))
            )}
          </div>,
          document.body
        )}

      <button
        onClick={handleConfirmSelected}
        disabled={!selected}
        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black disabled:opacity-30 hover:opacity-90 transition-opacity"
      >
        Подтвердить
      </button>
      <button
        onClick={handleConfirmNew}
        className="px-3 py-2 bg-white border border-neutral-200 text-neutral-500 rounded-xl text-xs font-black hover:bg-neutral-50 transition-colors whitespace-nowrap"
        title={`Создать новую игру "${entry.rawName}"`}
      >
        + Новая
      </button>
      <button
        onClick={() => onReject(entry.id)}
        className="p-2 bg-white border border-neutral-200 text-neutral-400 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
        title="Удалить из очереди (не игра / мусорная строка)"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
