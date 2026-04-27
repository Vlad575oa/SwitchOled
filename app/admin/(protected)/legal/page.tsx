"use client";

import { useEffect, useState } from "react";
import {
  Save, Scale, Lock, FileText, Cookie,
  Plus, Trash2, GripVertical, ChevronDown, ExternalLink
} from "lucide-react";

const inputCls = "w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-[#111827] placeholder:text-neutral-300 outline-none focus:bg-white focus:border-primary/30 transition-all";
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5";

interface Section {
  title: string;
  text: string[];
}

interface LegalDoc {
  title: string;
  description: string;
  sections: Section[];
}

type AllDocs = Record<string, LegalDoc>;

const DOCS = [
  { slug: "offer",   label: "Публичная оферта",       icon: Scale,    url: "/legal/offer" },
  { slug: "privacy", label: "Конфиденциальность",      icon: Lock,     url: "/legal/privacy" },
  { slug: "terms",   label: "Условия использования",   icon: FileText, url: "/legal/terms" },
  { slug: "cookies", label: "Файлы Cookie",            icon: Cookie,   url: "/legal/cookies" },
];

function emptyDoc(): LegalDoc {
  return { title: "", description: "", sections: [] };
}

export default function LegalPage() {
  const [data, setData] = useState<AllDocs>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [activeSlug, setActiveSlug] = useState("offer");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/admin/legal")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const doc = data[activeSlug] ?? emptyDoc();

  const setDoc = (slug: string, next: LegalDoc) =>
    setData((p) => ({ ...p, [slug]: next }));

  const setMeta = (key: "title" | "description", val: string) =>
    setDoc(activeSlug, { ...doc, [key]: val });

  const setSectionTitle = (si: number, val: string) => {
    const sections = doc.sections.map((s, i) => i === si ? { ...s, title: val } : s);
    setDoc(activeSlug, { ...doc, sections });
  };

  const setParagraph = (si: number, pi: number, val: string) => {
    const sections = doc.sections.map((s, i) => {
      if (i !== si) return s;
      const text = s.text.map((t, j) => j === pi ? val : t);
      return { ...s, text };
    });
    setDoc(activeSlug, { ...doc, sections });
  };

  const addParagraph = (si: number) => {
    const sections = doc.sections.map((s, i) =>
      i === si ? { ...s, text: [...s.text, ""] } : s
    );
    setDoc(activeSlug, { ...doc, sections });
  };

  const removeParagraph = (si: number, pi: number) => {
    const sections = doc.sections.map((s, i) =>
      i === si ? { ...s, text: s.text.filter((_, j) => j !== pi) } : s
    );
    setDoc(activeSlug, { ...doc, sections });
  };

  const addSection = () => {
    const newIdx = doc.sections.length;
    setDoc(activeSlug, {
      ...doc,
      sections: [...doc.sections, { title: `${newIdx + 1}. Новый раздел`, text: [""] }],
    });
    setOpenSections((p) => ({ ...p, [`${activeSlug}-${newIdx}`]: true }));
  };

  const removeSection = (si: number) => {
    const sections = doc.sections.filter((_, i) => i !== si);
    setDoc(activeSlug, { ...doc, sections });
  };

  const toggleSection = (key: string) =>
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const saveDoc = async (slug: string) => {
    setSaving(slug);
    await fetch("/api/admin/legal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(null);
    setSaved(slug);
    setTimeout(() => setSaved(null), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activeDoc = DOCS.find((d) => d.slug === activeSlug)!;

  return (
    <>
      <header className="bg-white border-b border-neutral-100 px-8 py-5">
        <h1 className="text-xl font-black text-[#111827] flex items-center gap-2">
          <Scale size={18} className="text-primary" /> Правовые документы
        </h1>
        <p className="text-xs text-neutral-400 font-bold mt-0.5">Редактируйте публичные правовые страницы сайта</p>
      </header>

      <div className="p-8 flex gap-6 max-w-5xl">
        {/* Sidebar tabs */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            {DOCS.map((doc) => {
              const Icon = doc.icon;
              const active = activeSlug === doc.slug;
              return (
                <button
                  key={doc.slug}
                  onClick={() => setActiveSlug(doc.slug)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm font-black transition-all border-b border-neutral-50 last:border-0 ${
                    active ? "bg-primary/5 text-primary" : "text-neutral-500 hover:bg-neutral-50 hover:text-[#111827]"
                  }`}
                >
                  <Icon size={15} className={active ? "text-primary" : "text-neutral-400"} />
                  <span className="leading-tight">{doc.label}</span>
                </button>
              );
            })}
          </div>

          <a
            href={activeDoc.url}
            target="_blank"
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-black text-neutral-500 hover:text-primary hover:border-primary/30 transition-all"
          >
            <ExternalLink size={12} />
            Просмотр страницы
          </a>
        </div>

        {/* Editor */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Header + Save */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <activeDoc.icon size={16} className="text-primary" />
                <h2 className="text-sm font-black text-[#111827]">{activeDoc.label}</h2>
              </div>
              <button
                onClick={() => saveDoc(activeSlug)}
                disabled={saving === activeSlug}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-xs font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                <Save size={13} />
                {saving === activeSlug ? "Сохранение..." : saved === activeSlug ? "Сохранено ✓" : "Сохранить"}
              </button>
            </div>

            {/* Meta fields */}
            <div className="p-6 space-y-4 border-b border-neutral-50">
              <div>
                <label className={labelCls}>Заголовок документа</label>
                <input
                  className={inputCls}
                  value={doc.title}
                  onChange={(e) => setMeta("title", e.target.value)}
                  placeholder="Название документа"
                />
              </div>
              <div>
                <label className={labelCls}>Описание (для SEO / meta description)</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={2}
                  value={doc.description}
                  onChange={(e) => setMeta("description", e.target.value)}
                  placeholder="Краткое описание документа"
                />
              </div>
            </div>

            {/* Sections */}
            <div className="divide-y divide-neutral-50">
              {doc.sections.map((section, si) => {
                const sKey = `${activeSlug}-${si}`;
                const isOpen = openSections[sKey] !== false;
                return (
                  <div key={si}>
                    {/* Section header */}
                    <div className="flex items-center gap-2 px-6 py-3 hover:bg-neutral-50/60 transition-colors">
                      <GripVertical size={14} className="text-neutral-300 flex-shrink-0" />
                      <button
                        onClick={() => toggleSection(sKey)}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <span className="text-sm font-black text-[#111827] truncate">
                          {section.title || `Раздел ${si + 1}`}
                        </span>
                        <ChevronDown
                          size={15}
                          className={`text-neutral-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      <button
                        onClick={() => removeSection(si)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                        title="Удалить раздел"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Section body */}
                    {isOpen && (
                      <div className="px-6 pb-5 space-y-4 bg-neutral-50/30">
                        <div>
                          <label className={labelCls}>Заголовок раздела</label>
                          <input
                            className={inputCls}
                            value={section.title}
                            onChange={(e) => setSectionTitle(si, e.target.value)}
                            placeholder="Напр. «1. Общие положения»"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className={labelCls}>Абзацы</label>
                          {section.text.map((para, pi) => (
                            <div key={pi} className="flex gap-2">
                              <textarea
                                className={`${inputCls} resize-none flex-1`}
                                rows={3}
                                value={para}
                                onChange={(e) => setParagraph(si, pi, e.target.value)}
                                placeholder={`Абзац ${pi + 1}`}
                              />
                              <button
                                onClick={() => removeParagraph(si, pi)}
                                className="w-8 h-8 mt-1 rounded-lg flex items-center justify-center text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                                title="Удалить абзац"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addParagraph(si)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-black text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
                          >
                            <Plus size={13} />
                            Добавить абзац
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add section */}
            <div className="p-6 border-t border-neutral-50">
              <button
                onClick={addSection}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 border-2 border-dashed border-neutral-200 rounded-xl text-sm font-black text-neutral-400 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Plus size={16} />
                Добавить раздел
              </button>
            </div>
          </div>

          <p className="text-[10px] text-neutral-400 font-bold px-1">
            Изменения сохраняются в файл и отображаются на сайте при следующем запросе страницы.
          </p>
        </div>
      </div>
    </>
  );
}
