"use client";

import { useEffect, useState } from "react";
import { Save, Home, GripVertical } from "lucide-react";
import { ALL_QUICK_LINKS } from "@/lib/constants/quickLinks";

export default function AdminHomePage() {
  const [enabledSlugs, setEnabledSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((data) => {
        const slugs = data?.home?.quick_filter_slugs;
        if (Array.isArray(slugs) && slugs.length > 0) {
          setEnabledSlugs(slugs);
        } else {
          // По умолчанию — все включены
          setEnabledSlugs(ALL_QUICK_LINKS.map((l) => l.slug));
        }
      })
      .catch(() => setEnabledSlugs(ALL_QUICK_LINKS.map((l) => l.slug)))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (slug: string) => {
    setEnabledSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // Читаем текущий pages.json
      const res = await fetch("/api/admin/pages");
      const current = await res.json();

      const updated = {
        ...current,
        home: {
          ...(current.home ?? {}),
          quick_filter_slugs: enabledSlugs,
        },
      };

      const saveRes = await fetch("/api/admin/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (saveRes.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const previewLinks = ALL_QUICK_LINKS.filter((l) => enabledSlugs.includes(l.slug));

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Home size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Главная страница</p>
            <h1 className="text-lg font-black text-[#111827] leading-tight">Настройки каталога</h1>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
        >
          <Save size={14} />
          {saving ? "Сохранение..." : saved ? "Сохранено ✓" : "Сохранить"}
        </button>
      </header>

      <div className="p-8 max-w-3xl mx-auto space-y-6">
        {/* Quick Filters section */}
        <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-base font-black text-[#111827] mb-1">Быстрые фильтры (строка под поиском)</h2>
            <p className="text-xs text-neutral-400 font-medium">
              Выберите категории, которые отображаются в строке быстрых фильтров на главной странице и в каталоге. Порядок соответствует порядку в списке.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-neutral-400 text-sm font-bold">Загрузка...</div>
          ) : (
            <div className="space-y-2">
              {ALL_QUICK_LINKS.map((link) => {
                const enabled = enabledSlugs.includes(link.slug);
                return (
                  <label
                    key={link.slug}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                      enabled
                        ? "bg-primary/5 border-primary/20"
                        : "bg-neutral-50 border-neutral-100 hover:bg-neutral-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggle(link.slug)}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-black ${enabled ? "text-[#111827]" : "text-neutral-400"}`}>
                        {link.label}
                      </p>
                      <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{link.href}</p>
                    </div>
                    <GripVertical size={14} className="text-neutral-300" />
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {/* Preview */}
        {!loading && (
          <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
            <h2 className="text-sm font-black text-[#111827] mb-4">Предпросмотр строки</h2>
            <div className="bg-[#F4F5F7] rounded-xl px-4 py-3 flex items-center gap-1 flex-wrap">
              {previewLinks.length === 0 ? (
                <span className="text-xs text-neutral-400 font-medium">Нет выбранных категорий — отобразятся все</span>
              ) : (
                previewLinks.map((link, i) => (
                  <span
                    key={link.slug}
                    className={`text-[12px] whitespace-nowrap px-2.5 py-1.5 rounded-lg font-bold ${
                      i === 0 ? "font-black text-[#111827]" : "text-neutral-400"
                    }`}
                  >
                    {link.label}
                    {i === 0 && <span className="inline-block ml-0.5 w-1 h-1 rounded-full bg-red-500 align-middle" />}
                  </span>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
