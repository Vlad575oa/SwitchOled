"use client";

import { useEffect, useState } from "react";
import { Save, Layers, Phone, Truck, ShieldCheck, Info, ChevronDown } from "lucide-react";

const inputCls = "w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-[#111827] placeholder:text-neutral-300 outline-none focus:bg-white focus:border-primary/30 transition-all";
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5";

// ── About sub-groups ──────────────────────────────────────────────
const ABOUT_GROUPS = [
  {
    key: "hero",
    label: "🎯 Герой (заголовок страницы)",
    fields: [
      { key: "hero_label", label: "Метка над заголовком (напр. «История бренда»)", type: "input" },
      { key: "hero_title", label: "Главный заголовок (большой текст)", type: "input" },
      { key: "hero_subtitle", label: "Подзаголовок (напр. «с 2017 года»)", type: "input" },
      { key: "hero_text1", label: "Абзац 1 (жирный текст)", type: "textarea" },
      { key: "hero_text2", label: "Абзац 2 (основной текст)", type: "textarea" },
    ],
  },
  {
    key: "stats",
    label: "📊 Статистика (3 цифры в блоке героя)",
    fields: [
      { key: "stat1_value", label: "Цифра 1 (напр. «7+»)", type: "input" },
      { key: "stat1_label", label: "Подпись 1 (напр. «лет на рынке»)", type: "input" },
      { key: "stat2_value", label: "Цифра 2 (напр. «12k+»)", type: "input" },
      { key: "stat2_label", label: "Подпись 2", type: "input" },
      { key: "stat3_value", label: "Цифра 3 (напр. «4.9»)", type: "input" },
      { key: "stat3_label", label: "Подпись 3 (напр. «рейтинг»)", type: "input" },
    ],
  },
  {
    key: "mission",
    label: "💬 Миссия и цитата (тёмный блок)",
    fields: [
      { key: "mission_quote", label: "Цитата (большой текст)", type: "textarea" },
      { key: "mission_text1", label: "Абзац миссии 1", type: "textarea" },
      { key: "mission_text2", label: "Абзац миссии 2", type: "textarea" },
    ],
  },
  {
    key: "timeline",
    label: "📅 История компании (5 этапов)",
    fields: [
      { key: "timeline_1_year", label: "Год 1", type: "input" },
      { key: "timeline_1_title", label: "Название этапа 1", type: "input" },
      { key: "timeline_1_desc", label: "Описание этапа 1", type: "textarea" },
      { key: "timeline_2_year", label: "Год 2", type: "input" },
      { key: "timeline_2_title", label: "Название этапа 2", type: "input" },
      { key: "timeline_2_desc", label: "Описание этапа 2", type: "textarea" },
      { key: "timeline_3_year", label: "Год 3", type: "input" },
      { key: "timeline_3_title", label: "Название этапа 3", type: "input" },
      { key: "timeline_3_desc", label: "Описание этапа 3", type: "textarea" },
      { key: "timeline_4_year", label: "Год 4", type: "input" },
      { key: "timeline_4_title", label: "Название этапа 4", type: "input" },
      { key: "timeline_4_desc", label: "Описание этапа 4", type: "textarea" },
      { key: "timeline_5_year", label: "Год 5", type: "input" },
      { key: "timeline_5_title", label: "Название этапа 5", type: "input" },
      { key: "timeline_5_desc", label: "Описание этапа 5", type: "textarea" },
    ],
  },
  {
    key: "values",
    label: "⭐ Наши принципы (4 карточки)",
    fields: [
      { key: "values_1_title", label: "Принцип 1 — заголовок", type: "input" },
      { key: "values_1_desc", label: "Принцип 1 — описание", type: "textarea" },
      { key: "values_2_title", label: "Принцип 2 — заголовок", type: "input" },
      { key: "values_2_desc", label: "Принцип 2 — описание", type: "textarea" },
      { key: "values_3_title", label: "Принцип 3 — заголовок", type: "input" },
      { key: "values_3_desc", label: "Принцип 3 — описание", type: "textarea" },
      { key: "values_4_title", label: "Принцип 4 — заголовок", type: "input" },
      { key: "values_4_desc", label: "Принцип 4 — описание", type: "textarea" },
    ],
  },
  {
    key: "cta",
    label: "🚀 Призыв к действию (нижний блок)",
    fields: [
      { key: "cta_title", label: "Заголовок CTA", type: "input" },
      { key: "cta_subtitle", label: "Подзаголовок CTA", type: "textarea" },
      { key: "cta_phone", label: "Телефон (отображается в CTA)", type: "input" },
      { key: "cta_email", label: "Email (отображается в CTA)", type: "input" },
    ],
  },
];

const SECTIONS = [
  {
    key: "about",
    label: "О компании",
    icon: Info,
    previewUrl: "/about",
    isAbout: true,
  },
  {
    key: "delivery",
    label: "Доставка",
    icon: Truck,
    previewUrl: "/delivery",
    isAbout: false,
    groups: [
      {
        key: "delivery_hero",
        label: "📌 Общее",
        fields: [
          { key: "title", label: "Заголовок страницы (метка)", type: "input" },
          { key: "hero_text", label: "Подзаголовок героя", type: "textarea" },
          { key: "show_guarantees", label: "Показывать нижний блок гарантий", type: "checkbox" },
        ],
      },
      {
        key: "delivery_express",
        label: "⚡ Экспресс-курьер (по Москве)",
        fields: [
          { key: "show_express", label: "Показывать блок", type: "checkbox" },
          { key: "express_price", label: "Цена (напр. «500 ₽»)", type: "input" },
          { key: "express_free_from", label: "Бесплатно от (напр. «Бесплатно от 50 000 ₽»)", type: "input" },
          { key: "express_time", label: "Срок (напр. «В день заказа»)", type: "input" },
          { key: "express_desc", label: "Описание", type: "textarea" },
        ],
      },
      {
        key: "delivery_sdek",
        label: "🚚 СДЭК / Boxberry (по России)",
        fields: [
          { key: "show_sdek", label: "Показывать блок", type: "checkbox" },
          { key: "sdek_price", label: "Цена (напр. «от 250 ₽»)", type: "input" },
          { key: "sdek_free_from", label: "Бесплатно от", type: "input" },
          { key: "sdek_time", label: "Срок (напр. «2–7 рабочих дней»)", type: "input" },
          { key: "sdek_desc", label: "Описание", type: "textarea" },
        ],
      },
      {
        key: "delivery_pickup",
        label: "📍 Самовывоз",
        fields: [
          { key: "show_pickup", label: "Показывать блок", type: "checkbox" },
          { key: "pickup_address", label: "Адрес / метро (напр. «Москва, м. Митино»)", type: "input" },
          { key: "pickup_time", label: "Срок готовности", type: "input" },
          { key: "pickup_hours", label: "Часы работы шоурума", type: "input" },
          { key: "pickup_desc", label: "Описание", type: "textarea" },
        ],
      },
      {
        key: "delivery_packaging",
        label: "📦 Упаковка",
        fields: [
          { key: "show_packaging", label: "Показывать блок", type: "checkbox" },
          { key: "packaging_desc", label: "Описание упаковки", type: "textarea" },
        ],
      },
      {
        key: "delivery_payments",
        label: "💳 Способы оплаты",
        fields: [
          { key: "show_payments", label: "Показывать блок", type: "checkbox" },
          { key: "payments_title", label: "Заголовок секции", type: "input" },
          { key: "payments_1_title", label: "Карточка 1 — заголовок", type: "input" },
          { key: "payments_1_desc", label: "Карточка 1 — описание", type: "textarea" },
          { key: "payments_2_title", label: "Карточка 2 — заголовок", type: "input" },
          { key: "payments_2_desc", label: "Карточка 2 — описание", type: "textarea" },
          { key: "payments_3_title", label: "Карточка 3 — заголовок", type: "input" },
          { key: "payments_3_desc", label: "Карточка 3 — описание", type: "textarea" },
          { key: "payments_4_title", label: "Карточка 4 — заголовок", type: "input" },
          { key: "payments_4_desc", label: "Карточка 4 — описание", type: "textarea" },
          { key: "payments_conditions_title", label: "Условия оплаты — заголовок", type: "input" },
          { key: "payments_conditions_text", label: "Условия оплаты — текст", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "contacts",
    label: "Контакты",
    icon: Phone,
    previewUrl: "/contacts",
    isAbout: false,
    groups: [
      {
        key: "contacts_main",
        label: "📞 Основные контакты",
        fields: [
          { key: "phone", label: "Телефон (напр. «7(926)676-34-88»)", type: "input" },
          { key: "email", label: "Email", type: "input" },
          { key: "address", label: "Адрес шоурума (отображается в карточке «Шоурум»)", type: "input" },
        ],
      },
      {
        key: "contacts_social",
        label: "🔗 Мессенджеры и соцсети",
        fields: [
          { key: "telegram", label: "Telegram URL (напр. «https://t.me/+79266763488»)", type: "input" },
          { key: "whatsapp", label: "WhatsApp URL", type: "input" },
          { key: "vk", label: "ВКонтакте URL", type: "input" },
        ],
      },
      {
        key: "contacts_hours",
        label: "🕐 График работы",
        fields: [
          { key: "hours_weekdays", label: "Время работы (напр. «10:00 — 21:00»)", type: "input" },
        ],
      },
      {
        key: "contacts_requisites",
        label: "🏢 Реквизиты",
        fields: [
          { key: "company_name", label: "Название компании (напр. «ИП Якубов Р.В.»)", type: "input" },
          { key: "full_name", label: "ФИО", type: "input" },
          { key: "inn", label: "ИНН", type: "input" },
          { key: "ogrnip", label: "ОГРНИП", type: "input" },
          { key: "legal_address", label: "Юридический адрес", type: "input" },
        ],
      },
      {
        key: "contacts_partner",
        label: "🤝 По вопросам сотрудничества",
        fields: [
          { key: "partner_phone", label: "Телефон для партнёров", type: "input" },
          { key: "partner_email", label: "Email для партнёров", type: "input" },
        ],
      },
    ],
  },
  {
    key: "warranty",
    label: "Гарантия",
    icon: ShieldCheck,
    previewUrl: "/warranty",
    isAbout: false,
    groups: [
      {
        key: "warranty_main",
        label: "🛡️ Гарантия на консоли",
        fields: [
          { key: "title", label: "Заголовок страницы (метка)", type: "input" },
          { key: "warranty_period", label: "Срок гарантии (напр. «12 месяцев»)", type: "input" },
          { key: "warranty_desc", label: "Описание гарантии (в карточке «Консоли»)", type: "textarea" },
          { key: "warranty_text", label: "Подзаголовок героя / общий текст", type: "textarea" },
        ],
      },
      {
        key: "warranty_accessories",
        label: "🎮 Гарантия на аксессуары",
        fields: [
          { key: "accessories_period", label: "Срок гарантии (напр. «6 месяцев»)", type: "input" },
          { key: "accessories_desc", label: "Описание", type: "textarea" },
        ],
      },
      {
        key: "warranty_return",
        label: "↩️ Возврат",
        fields: [
          { key: "return_period", label: "Срок возврата (напр. «14 дней»)", type: "input" },
          { key: "return_text", label: "Текст об условиях возврата (нижний блок)", type: "textarea" },
        ],
      },
      {
        key: "warranty_contacts",
        label: "📬 Контакты для гарантийных случаев",
        fields: [
          { key: "telegram", label: "Telegram URL", type: "input" },
          { key: "email", label: "Email", type: "input" },
        ],
      },
    ],
  },
];

export default function PagesPage() {
  const [data, setData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("about");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ hero: true });

  useEffect(() => {
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const setField = (section: string, key: string, val: string) =>
    setData((p) => ({ ...p, [section]: { ...(p[section] ?? {}), [key]: val } }));

  const toggleGroup = (key: string) =>
    setOpenGroups((p) => ({ ...p, [key]: !p[key] }));

  const saveSection = async (sectionKey: string) => {
    setSaving(sectionKey);
    await fetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(null);
    setSaved(sectionKey);
    setTimeout(() => setSaved(null), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const section = SECTIONS.find((s) => s.key === activeSection)!;

  const renderField = (sectionKey: string, field: { key: string; label: string; type: string }) => (
    <div key={field.key}>
      {field.type === "checkbox" ? (
        <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#e60012]"
            checked={(data[sectionKey]?.[field.key] ?? "true") === "true"}
            onChange={(e) => setField(sectionKey, field.key, String(e.target.checked))}
          />
          <span className="text-sm font-black text-[#111827]">{field.label}</span>
        </label>
      ) : field.type === "textarea" ? (
        <>
          <label className={labelCls}>{field.label}</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={4}
          value={data[sectionKey]?.[field.key] ?? ""}
          onChange={(e) => setField(sectionKey, field.key, e.target.value)}
        />
        </>
      ) : (
        <>
          <label className={labelCls}>{field.label}</label>
        <input
          className={inputCls}
          value={data[sectionKey]?.[field.key] ?? ""}
          onChange={(e) => setField(sectionKey, field.key, e.target.value)}
        />
        </>
      )}
    </div>
  );

  const renderGroups = (sectionKey: string, groups: { key: string; label: string; fields: { key: string; label: string; type: string }[] }[]) => (
    <div className="divide-y divide-neutral-50">
      {groups.map((group) => (
        <div key={group.key}>
          <button
            onClick={() => toggleGroup(group.key)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-neutral-50/60 transition-colors"
          >
            <span className="text-sm font-black text-[#111827]">{group.label}</span>
            <ChevronDown
              size={16}
              className={`text-neutral-400 transition-transform duration-200 ${openGroups[group.key] ? "rotate-180" : ""}`}
            />
          </button>
          {openGroups[group.key] && (
            <div className="px-6 pb-6 space-y-4 bg-neutral-50/30">
              {group.fields.map((field) => renderField(sectionKey, field))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <header className="bg-white border-b border-neutral-100 px-8 py-5">
        <h1 className="text-xl font-black text-[#111827] flex items-center gap-2">
          <Layers size={18} className="text-primary" /> Редактор страниц
        </h1>
        <p className="text-xs text-neutral-400 font-bold mt-0.5">Изменяйте контент статических страниц сайта</p>
      </header>

      <div className="p-8 flex gap-6 max-w-5xl">
        {/* Tabs */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm font-black transition-all border-b border-neutral-50 last:border-0 ${
                  activeSection === s.key
                    ? "bg-primary/5 text-primary"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-[#111827]"
                }`}
              >
                <s.icon size={15} className={activeSection === s.key ? "text-primary" : "text-neutral-400"} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Preview link */}
          {section.previewUrl && (
            <a
              href={section.previewUrl}
              target="_blank"
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-black text-neutral-500 hover:text-primary hover:border-primary/30 transition-all"
            >
              Просмотр страницы ↗
            </a>
          )}
        </div>

        {/* Form */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <section.icon size={16} className="text-primary" />
                <h2 className="text-sm font-black text-[#111827]">Страница: {section.label}</h2>
              </div>
              <button
                onClick={() => saveSection(section.key)}
                disabled={saving === section.key}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-xs font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                <Save size={13} />
                {saving === section.key ? "Сохранение..." : saved === section.key ? "Сохранено ✓" : "Сохранить"}
              </button>
            </div>

            {/* О компании: accordion groups */}
            {section.isAbout ? (
              renderGroups("about", ABOUT_GROUPS)
            ) : section.groups ? (
              /* Sections with groups (delivery, contacts, warranty) */
              renderGroups(section.key, section.groups)
            ) : null}
          </div>

          <p className="text-[10px] text-neutral-400 font-bold mt-3 px-1">
            Изменения сохраняются в файл и применяются при следующем запросе страницы.
          </p>
        </div>
      </div>
    </>
  );
}
