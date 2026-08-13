"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Pencil, Trash2, X, Save, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type GameRow = {
  id: number;
  canonicalName: string;
  platform: string;
  region: string | null;
  _count: { aliases: number; entries: number };
  supplierCount: number;
};

type Alias = { id: number; rawText: string; normalized: string; source: string; createdAt: string };

type GameDetail = GameRow & {
  aliases: Alias[];
  entries: {
    id: number;
    rawName: string;
    priceRetail: number | null;
    priceWholesale: number | null;
    upload: { supplier: { name: string } };
  }[];
};

const PLATFORMS = ["Все", "PS4", "PS5", "SWITCH", "PSP", "XBOX"];
const PAGE_SIZE = 100;
const SUPPLIER_COUNT_OPTIONS = [
  { label: "Все", value: null },
  { label: "У 4 поставщиков", value: 4 },
  { label: "У 3 поставщиков", value: 3 },
  { label: "У 2 поставщиков", value: 2 },
  { label: "Только у 1", value: 1 },
];

export default function GamesDictionaryPage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("Все");
  const [supplierCount, setSupplierCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<GameDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPlatform, setEditPlatform] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (platform !== "Все") params.set("platform", platform);
      if (supplierCount != null) params.set("supplierCount", String(supplierCount));
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      const res = await fetch(`/api/admin/games?${params.toString()}`);
      const data = await res.json();
      setGames(data.games || []);
      setTotal(data.total || 0);
      setPageSize(data.pageSize || PAGE_SIZE);
    } catch {
      toast.error("Не удалось загрузить справочник игр");
    } finally {
      setLoading(false);
    }
  };

  // Смена поиска/платформы/фильтра сбрасывает на первую страницу.
  useEffect(() => {
    setPage(1);
  }, [search, platform, supplierCount]);

  useEffect(() => {
    const timeout = setTimeout(fetchGames, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, platform, supplierCount, page]);

  const openGame = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/games/${id}`);
      const data: GameDetail = await res.json();
      setSelected(data);
      setEditName(data.canonicalName);
      setEditPlatform(data.platform);
      setEditRegion(data.region || "");
    } catch {
      toast.error("Не удалось загрузить игру");
    } finally {
      setDetailLoading(false);
    }
  };

  const saveGame = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/games/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonicalName: editName, platform: editPlatform, region: editRegion || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ошибка при сохранении");
        return;
      }
      toast.success("Сохранено");
      setSelected(null);
      fetchGames();
    } catch {
      toast.error("Ошибка сервера");
    } finally {
      setSaving(false);
    }
  };

  const deleteGame = async () => {
    if (!selected) return;
    if (!confirm(`Удалить "${selected.canonicalName}" из справочника? Связанные строки прайсов вернутся в очередь на подтверждение.`)) return;
    try {
      const res = await fetch(`/api/admin/games/${selected.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Не удалось удалить");
        return;
      }
      toast.success("Игра удалена");
      setSelected(null);
      fetchGames();
    } catch {
      toast.error("Ошибка сервера");
    }
  };

  const deleteAlias = async (aliasId: number) => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/admin/games/${selected.id}/aliases/${aliasId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Не удалось удалить алиас");
        return;
      }
      toast.success("Алиас удалён, строка вернулась в очередь");
      setSelected((prev) => (prev ? { ...prev, aliases: prev.aliases.filter((a) => a.id !== aliasId) } : prev));
      fetchGames();
    } catch {
      toast.error("Ошибка сервера");
    }
  };

  return (
    <>
      <header className="bg-white border-b border-neutral-100 px-8 py-5 flex items-center gap-4">
        <Link href="/admin/price-compare" className="p-2 hover:bg-neutral-50 rounded-xl transition-colors">
          <ArrowLeft size={18} className="text-neutral-500" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#111827]">Справочник игр</h1>
          <p className="text-xs text-neutral-400 font-bold mt-0.5">Канонические названия игр, к которым сопоставляются строки прайсов</p>
        </div>
      </header>

      <div className="p-8 flex gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:border-primary/40 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-colors ${
                    platform === p ? "bg-primary text-white" : "bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {SUPPLIER_COUNT_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setSupplierCount(opt.value)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-colors ${
                  supplierCount === opt.value ? "bg-primary text-white" : "bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 flex items-center justify-center text-neutral-400">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : games.length === 0 ? (
              <div className="p-12 text-center text-sm text-neutral-400 font-bold">Ничего не найдено</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-neutral-100">
                    <th className="text-right px-4 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400 w-12">№</th>
                    <th className="text-left px-6 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400">Игра</th>
                    <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400">Платформа</th>
                    <th className="text-right px-4 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400">Поставщиков</th>
                    <th className="text-right px-4 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400">Алиасов</th>
                    <th className="text-right px-4 py-3 font-black text-[10px] uppercase tracking-widest text-neutral-400">Строк цен</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {games.map((g, index) => (
                    <tr
                      key={g.id}
                      onClick={() => openGame(g.id)}
                      className={`cursor-pointer hover:bg-neutral-50/50 ${selected?.id === g.id ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-4 py-3 text-right text-neutral-400 font-bold">{(page - 1) * pageSize + index + 1}</td>
                      <td className="px-6 py-3 font-bold text-[#111827]">{g.canonicalName}</td>
                      <td className="px-4 py-3 text-neutral-500 font-bold">{g.platform}</td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg ${
                            g.supplierCount >= 4
                              ? "bg-green-100 text-green-700"
                              : g.supplierCount >= 2
                              ? "bg-amber-100 text-amber-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {g.supplierCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500 font-bold">{g._count.aliases}</td>
                      <td className="px-4 py-3 text-right text-neutral-500 font-bold">{g._count.entries}</td>
                      <td className="px-4 py-3 text-right">
                        <Pencil size={14} className="text-neutral-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  {page} / {Math.max(1, Math.ceil(total / pageSize))}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))}
                  disabled={page >= Math.ceil(total / pageSize)}
                  className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={15} className="text-neutral-500" />
                </button>
              </div>
            </div>
          )}
        </div>

        {selected && (
          <div className="w-96 shrink-0 bg-white rounded-2xl border border-neutral-100 shadow-sm h-fit sticky top-8">
            <div className="p-5 border-b border-neutral-50 flex items-center justify-between">
              <h2 className="text-sm font-black text-[#111827]">Редактирование</h2>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-neutral-50 rounded-lg transition-colors">
                <X size={16} className="text-neutral-400" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 size={18} className="animate-spin text-neutral-400" />
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Название</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-primary/40 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Платформа</label>
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-primary/40 transition-all"
                  >
                    {["PS4", "PS5", "SWITCH", "PSP", "XBOX"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Регион (необязательно)</label>
                  <input
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    placeholder="rus / eng / asia..."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-primary/40 transition-all"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveGame}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-black hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Сохранить
                  </button>
                  <button
                    onClick={deleteGame}
                    className="px-3 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                    title="Удалить игру"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {selected.aliases.length > 0 && (
                  <div className="pt-3 border-t border-neutral-50 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">
                      Алиасы ({selected.aliases.length})
                    </p>
                    <div className="max-h-64 overflow-y-auto space-y-1.5">
                      {selected.aliases.map((a) => (
                        <div key={a.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-neutral-50 rounded-lg">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#111827] truncate">{a.rawText}</p>
                            <p className="text-[10px] text-neutral-400 font-bold">{a.source === "ai" ? "ИИ" : a.source === "manual" ? "вручную" : "точное совпадение"}</p>
                          </div>
                          <button
                            onClick={() => deleteAlias(a.id)}
                            className="p-1 text-neutral-300 hover:text-red-500 transition-colors shrink-0"
                            title="Удалить алиас"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.entries.length > 0 && (
                  <div className="pt-3 border-t border-neutral-50 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">
                      Цены у поставщиков
                    </p>
                    <div className="max-h-64 overflow-y-auto space-y-1.5">
                      {selected.entries.map((e) => (
                        <div key={e.id} className="px-3 py-2 bg-neutral-50 rounded-lg">
                          <p className="text-xs font-bold text-[#111827]">{e.upload.supplier.name}</p>
                          <p className="text-[10px] text-neutral-400 font-bold">
                            {e.priceWholesale ?? e.priceRetail ?? "—"} ₽ · {e.rawName}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
