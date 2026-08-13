"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, Loader2, RefreshCw, CheckCircle2, AlertCircle, Ban, Sparkles, BookOpen, Square } from "lucide-react";
import { toast } from "sonner";

const AI_MATCH_TIMEOUT_MS = 5 * 60 * 1000;

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

const PLATFORMS = ["Все", "PS4", "PS5", "SWITCH", "PSP", "XBOX"];

export default function PriceComparePage() {
  const [games, setGames] = useState<CompareGame[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [platform, setPlatform] = useState("Все");
  const [search, setSearch] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [gameOptions, setGameOptions] = useState<GameOption[]>([]);
  const [aiResolving, setAiResolving] = useState(false);
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCompare = async (plat: string) => {
    setLoading(true);
    try {
      const url = plat === "Все" ? "/api/admin/price-compare" : `/api/admin/price-compare?platform=${plat}`;
      const res = await fetch(url);
      const data = await res.json();
      setGames(data.games || []);
      setSuppliers(data.suppliers || []);
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
      setGameOptions(data.games || []);
    } catch {
      // тихо — это не критичный блок
    }
  };

  // ИИ-сопоставление (DeepSeek) только для отмеченных галочками позиций — отдельная логика,
  // не связана с чат-ботом Кира на сайте.
  // Останавливается вручную (кнопка "Стоп") или автоматически через 5 минут — сервер
  // проверяет сигнал остановки между батчами и не отправляет новые запросы в DeepSeek,
  // так что уже обработанные позиции не пропадают, а лишние токены не тратятся.
  const resolveWithAi = async () => {
    const entryIds = Array.from(selectedPendingIds);
    if (entryIds.length === 0) return;

    const controller = new AbortController();
    aiAbortRef.current = controller;
    aiTimeoutRef.current = setTimeout(() => {
      controller.abort();
      toast.warning("ИИ-сопоставление остановлено автоматически — истекло 5 минут");
    }, AI_MATCH_TIMEOUT_MS);

    setAiResolving(true);
    try {
      const res = await fetch("/api/admin/price-entries/resolve-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryIds }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ошибка ИИ-сопоставления");
      } else if (data.stopped) {
        toast.info(`Остановлено: ${data.matched} сопоставлено, ${data.created} новых игр, ${data.skipped} пропущено`);
      } else {
        toast.success(`ИИ разобрал выбранные: ${data.matched} сопоставлено, ${data.created} новых игр, ${data.skipped} пропущено`);
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        toast.error("Ошибка сервера при ИИ-сопоставлении");
      }
    }

    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    aiAbortRef.current = null;
    setAiResolving(false);
    setSelectedPendingIds(new Set());
    fetchCompare(platform);
    fetchPending();
  };

  const stopAiResolving = () => {
    aiAbortRef.current?.abort();
    toast.info("Останавливаю ИИ-сопоставление...");
  };

  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      aiAbortRef.current?.abort();
    };
  }, []);

  const togglePendingSelected = (entryId: number) => {
    setSelectedPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  const toggleSelectAllPending = () => {
    setSelectedPendingIds((prev) => (prev.size === pending.length ? new Set() : new Set(pending.map((e) => e.id))));
  };

  useEffect(() => {
    fetchCompare(platform);
  }, [platform]);

  useEffect(() => {
    fetchPending();
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/price-uploads", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          if (data.error === "DUPLICATE") {
            toast.warning(`${file.name}: уже был загружен ранее`);
          } else if (data.error === "SUPPLIER_UNKNOWN") {
            toast.error(`${file.name}: не удалось определить поставщика`);
          } else {
            toast.error(`${file.name}: ${data.message || data.error || "ошибка загрузки"}`);
          }
          continue;
        }
        toast.success(`${file.name}: загружено ${data.rowsTotal} позиций (${data.rowsMatched} сопоставлено, ${data.rowsPending} требуют проверки)`);
      } catch {
        toast.error(`${file.name}: ошибка сервера`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchCompare(platform);
    fetchPending();
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
      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
      fetchCompare(platform);
    } catch {
      toast.error("Ошибка сервера");
    }
  };

  const filteredGames = games.filter((g) => {
    if (search.trim() && !g.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (onlyInStock && !g.prices.some((p) => p.inStock && p.price != null)) return false;
    return true;
  });

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
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-black hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Загрузить прайсы
          </button>
          <button
            onClick={() => { fetchCompare(platform); fetchPending(); }}
            className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors"
            title="Обновить"
          >
            <RefreshCw size={15} className="text-neutral-500" />
          </button>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-amber-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <AlertCircle size={16} className="text-amber-600" />
                <h2 className="text-sm font-black text-amber-800">
                  {pending.length} позиций требуют подтверждения
                </h2>
                <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 cursor-pointer select-none ml-2">
                  <input
                    type="checkbox"
                    checked={pending.length > 0 && selectedPendingIds.size === pending.length}
                    onChange={toggleSelectAllPending}
                    className="accent-amber-600"
                  />
                  Выбрать все
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resolveWithAi}
                  disabled={aiResolving || selectedPendingIds.size === 0}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-black hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {aiResolving ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Сопоставить через ИИ{selectedPendingIds.size > 0 ? ` (${selectedPendingIds.size})` : ""}
                </button>
                {aiResolving && (
                  <button
                    onClick={stopAiResolving}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-black hover:bg-red-50 transition-colors"
                  >
                    <Square size={12} />
                    Стоп
                  </button>
                )}
              </div>
            </div>
            <div className="divide-y divide-amber-100 max-h-96 overflow-y-auto">
              {pending.map((entry) => (
                <PendingRow
                  key={entry.id}
                  entry={entry}
                  gameOptions={gameOptions}
                  onConfirm={confirmEntry}
                  checked={selectedPendingIds.has(entry.id)}
                  onToggle={() => togglePendingSelected(entry.id)}
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

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию игры..."
            className="flex-1 min-w-[220px] px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-primary/40 transition-all"
          />

          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="accent-primary"
            />
            Только в наличии хотя бы у одного
          </label>

          {(search || onlyInStock) && (
            <button
              onClick={() => { setSearch(""); setOnlyInStock(false); }}
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
          ) : filteredGames.length === 0 ? (
            <div className="p-12 text-center text-sm text-neutral-400 font-bold">
              {games.length === 0 ? "Нет данных для сравнения — загрузите прайсы поставщиков" : "Ничего не найдено по текущим фильтрам"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-neutral-100">
                    <th className="text-right px-4 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400 w-12">№</th>
                    <th className="text-left px-6 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400">Игра</th>
                    <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400">Платформа</th>
                    {suppliers.map((s) => (
                      <th key={s.slug} className="text-right px-4 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filteredGames.map((g, index) => (
                    <tr key={g.gameId} className="hover:bg-neutral-50/30">
                      <td className="px-4 py-3 text-right text-neutral-400 font-bold">{index + 1}</td>
                      <td className="px-6 py-3 font-bold text-[#111827]">{g.name}</td>
                      <td className="px-4 py-3 text-neutral-500 font-bold">{g.platform}</td>
                      {suppliers.map((s) => {
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
      </div>
    </>
  );
}

function PendingRow({
  entry,
  gameOptions,
  onConfirm,
  checked,
  onToggle,
}: {
  entry: PendingEntry;
  gameOptions: GameOption[];
  onConfirm: (entryId: number, gameId: number | null, newGame?: { canonicalName: string; platform: string }) => void;
  checked: boolean;
  onToggle: () => void;
}) {
  const [selected, setSelected] = useState("");

  const handleConfirm = () => {
    if (selected === "__new__") {
      onConfirm(entry.id, null, { canonicalName: entry.rawName, platform: entry.platform || "PS5" });
    } else if (selected) {
      onConfirm(entry.id, Number(selected));
    }
  };

  return (
    <div className="p-4 flex items-center gap-3 flex-wrap">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="accent-amber-600 shrink-0"
      />
      <div className="flex-1 min-w-[240px]">
        <p className="font-bold text-[#111827] text-sm">{entry.rawName}</p>
        <p className="text-xs text-neutral-400 font-bold mt-0.5">
          {entry.upload.supplier.name} · {entry.platform || "платформа неизвестна"} · {entry.priceWholesale ?? entry.priceRetail ?? "—"} ₽
        </p>
      </div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-primary/40"
      >
        <option value="">Выберите игру...</option>
        <option value="__new__">+ Новая игра: &quot;{entry.rawName}&quot;</option>
        {gameOptions.map((g) => (
          <option key={g.id} value={g.id}>
            {g.canonicalName} ({g.platform})
          </option>
        ))}
      </select>
      <button
        onClick={handleConfirm}
        disabled={!selected}
        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black disabled:opacity-30 hover:opacity-90 transition-opacity"
      >
        Подтвердить
      </button>
    </div>
  );
}
