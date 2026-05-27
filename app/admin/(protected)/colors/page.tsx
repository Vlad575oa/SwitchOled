"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Palette, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Color {
  id: number;
  name: string;
  hex: string;
}

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#000000");

  const fetchColors = async () => {
    try {
      const res = await fetch("/api/admin/colors");
      if (res.ok) {
        const data = await res.json();
        setColors(data);
      }
    } catch (err) {
      toast.error("Ошибка при загрузке цветов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/admin/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, hex: newHex }),
      });
      if (res.ok) {
        toast.success("Цвет добавлен");
        setNewName("");
        setNewHex("#000000");
        fetchColors();
      } else {
        const d = await res.json();
        toast.error(d.error || "Ошибка при добавлении");
      }
    } catch (err) {
      toast.error("Ошибка сервера");
    }
  };

  const handleUpdate = async (color: Color) => {
    setSavingId(color.id);
    try {
      const res = await fetch(`/api/admin/colors/${color.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: color.name, hex: color.hex }),
      });
      if (res.ok) {
        toast.success("Обновлено");
      } else {
        toast.error("Ошибка при обновлении");
      }
    } catch (err) {
      toast.error("Ошибка сервера");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить этот цвет?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/colors/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Цвет удален");
        setColors((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error("Ошибка при удалении");
      }
    } catch (err) {
      toast.error("Ошибка сервера");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-neutral-100 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#111827]">Управление цветами</h1>
          <p className="text-xs text-neutral-400 font-bold mt-0.5">Цвета для фильтров на сайте</p>
        </div>
      </header>

      <div className="p-8 max-w-4xl">
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-neutral-50 bg-neutral-50/30">
            <h2 className="text-sm font-black text-[#111827] flex items-center gap-2">
              <Plus size={15} className="text-primary" /> Добавить новый цвет
            </h2>
          </div>
          <div className="p-6 flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Название (как в базе)</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Напр: Neon Red"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-[#111827] outline-none focus:bg-white focus:border-primary/40 transition-all"
              />
            </div>
            <div className="space-y-1.5 w-32">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">HEX код</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newHex}
                  onChange={(e) => setNewHex(e.target.value)}
                  className="w-10 h-10 rounded-full border border-neutral-200 p-0 bg-white overflow-hidden cursor-pointer"
                />
                <input
                  value={newHex}
                  onChange={(e) => setNewHex(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 min-w-0 px-2 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-[#111827] outline-none focus:bg-white focus:border-primary/40 transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="bg-[#111827] text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-black/10 hover:bg-neutral-800 transition-all active:scale-95 h-[46px]"
            >
              Добавить
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-neutral-400 w-16">Кружок</th>
                <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-neutral-400">Название</th>
                <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-neutral-400 w-48">HEX код</th>
                <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-neutral-400 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-neutral-200" />
                  </td>
                </tr>
              ) : colors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Palette size={40} className="mx-auto mb-3 text-neutral-100" />
                    <p className="text-neutral-400 font-bold text-sm">Цвета не добавлены</p>
                  </td>
                </tr>
              ) : (
                colors.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div
                        className="w-8 h-8 rounded-full border border-neutral-200 shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        value={c.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setColors((prev) => prev.map((item) => item.id === c.id ? { ...item, name: val } : item));
                        }}
                        className="w-full bg-transparent border-none text-sm font-bold text-[#111827] outline-none focus:ring-0 p-0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={c.hex}
                          onChange={(e) => {
                            const val = e.target.value;
                            setColors((prev) => prev.map((item) => item.id === c.id ? { ...item, hex: val } : item));
                          }}
                          className="w-6 h-6 rounded-full border border-neutral-200 p-0 bg-white overflow-hidden cursor-pointer"
                        />
                        <input
                          value={c.hex}
                          onChange={(e) => {
                            const val = e.target.value;
                            setColors((prev) => prev.map((item) => item.id === c.id ? { ...item, hex: val } : item));
                          }}
                          className="flex-1 bg-transparent border-none text-xs font-mono text-neutral-400 outline-none focus:ring-0 p-0"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdate(c)}
                          disabled={savingId === c.id}
                          className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                        >
                          {savingId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                        >
                          {deletingId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
