"use client";

import {
  MessageCircle, Phone, Mail, MapPin, Clock,
  Building2
} from "lucide-react";
import { CONTACTS } from "@/lib/constants/contacts";
import { SupportChat } from "@/components/SupportChat";

interface ContactsData {
  phone?: string;
  email?: string;
  address?: string;
  telegram?: string;
  hours_weekdays?: string;
  company_name?: string;
  full_name?: string;
  inn?: string;
  ogrnip?: string;
  legal_address?: string;
  partner_phone?: string;
  partner_email?: string;
}

export default function ContactsClient({ data }: { data: ContactsData }) {
  const phone = data.phone ?? CONTACTS.phoneDisplay;
  const email = data.email ?? CONTACTS.email;
  const address = data.address ?? CONTACTS.address;
  const maxHref = data.telegram ?? "https://max.ru/u/f9LHodD0cOJQaSenuFWGazoHqG8RNEoO3xSyNKPTXj1s3tyqlHkFoF5UzUo";
  const phoneHref = `tel:+${phone.replace(/\D/g, "")}`;
  const hoursWeekdays = data.hours_weekdays ?? "10:00 — 21:00";

  const channels = [
    {
      icon: MessageCircle,
      label: "MAX",
      value: phone,
      sub: "Ответ до 15 минут",
      badge: "24/7",
      href: maxHref,
      accent: true,
    },
    {
      icon: Phone,
      label: "Телефон",
      value: phone,
      sub: hoursWeekdays,
      badge: "Бесплатно",
      href: phoneHref,
      accent: false,
    },
    {
      icon: Mail,
      label: "Email",
      value: email,
      sub: "Ответ до 2 часов",
      badge: "24/7",
      href: `mailto:${email}`,
      accent: false,
    },
    {
      icon: MapPin,
      label: "Шоурум",
      value: address,
      sub: "м. Митино, 5 мин пешком",
      badge: "Самовывоз",
      href: CONTACTS.yandexMapsUrl,
      accent: false,
    },
  ];

  const requisites = [
    { label: "Компания", value: data.company_name ?? "ИП Якубов Р.В." },
    { label: "ФИО", value: data.full_name ?? "Якубов Руслан Вячеславович" },
    { label: "ИНН", value: data.inn ?? "773370847288" },
    { label: "ОГРНИП", value: data.ogrnip ?? "323774600158589" },
    { label: "Адрес", value: data.legal_address ?? "125368, Россия, г. Москва" },
  ];

  const partnerPhone = data.partner_phone ?? "8 (926) 676-34-88";
  const partnerEmail = data.partner_email ?? "partner@gameshop24.ru";

  return (
    <div className="bg-white min-h-screen pt-6 pb-28">
      <div className="container max-w-5xl">

        {/* Hero */}
        <div className="mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-primary/10 rounded-full text-primary text-[11px] font-black uppercase tracking-[0.2em]">
            <MessageCircle size={14} />
            Контакты
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-secondary leading-[0.9] uppercase">
            Мы на связи<br />
            <span className="text-primary">24 / 7</span>
          </h1>
          <p className="text-lg text-neutral-400 font-bold max-w-xl leading-relaxed">
            Среднее время ответа — <strong className="text-secondary">15 минут</strong>. Пишите по любому вопросу: от выбора консоли до решения гарантийного случая.
          </p>
        </div>

        {/* Channel cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {channels.map((ch) => {
            const Icon = ch.icon;
            return (
              <a
                key={ch.label}
                href={ch.href}
                className={`group rounded-[28px] p-7 flex flex-col gap-4 transition-all duration-300 ${
                  ch.accent
                    ? "bg-secondary hover:bg-secondary/90"
                    : "bg-neutral-50 border border-transparent hover:bg-white hover:border-neutral-100 hover:shadow-xl hover:shadow-neutral-200/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${ch.accent ? "bg-white/15" : "bg-white shadow-sm group-hover:bg-primary group-hover:shadow-xl group-hover:shadow-primary/30 transition-all"}`}>
                    <Icon size={20} className={ch.accent ? "text-white" : "text-neutral-400 group-hover:text-white transition-colors"} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${ch.accent ? "bg-white/15 text-white" : "bg-primary/10 text-primary"}`}>
                    {ch.badge}
                  </span>
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${ch.accent ? "text-white/50" : "text-neutral-400"}`}>{ch.label}</p>
                  <p className={`font-black text-sm ${ch.accent ? "text-white" : "text-secondary"}`}>{ch.value}</p>
                </div>
                <p className={`text-xs font-bold ${ch.accent ? "text-white/50" : "text-neutral-400"}`}>{ch.sub}</p>
              </a>
            );
          })}
        </div>

        <div className="mb-10 flex flex-wrap gap-3">
          <a
            href={CONTACTS.yandexMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-neutral-900 text-white rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Открыть в Яндекс Картах
          </a>
          <a
            href={CONTACTS.twoGisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-neutral-100 text-secondary rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Открыть в 2ГИС
          </a>
        </div>

        <a
          href="#support-chat"
          className="mb-16 flex flex-col gap-5 rounded-[28px] border border-primary/15 bg-primary/[0.04] p-6 transition-all hover:border-primary/30 hover:bg-primary/[0.07] sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <MessageCircle size={22} />
            </div>
            <div>
              <p className="text-lg font-black text-secondary">Чат с поддержкой</p>
              <p className="mt-1 text-sm font-bold text-neutral-400">Сделать заказ или задать любой вопрос менеджеру</p>
            </div>
          </div>
          <span className="inline-flex items-center justify-center rounded-xl bg-secondary px-5 py-3 text-xs font-black uppercase tracking-wider text-white sm:shrink-0">
            Открыть чат
          </span>
        </a>

        <SupportChat className="mb-16" />

        {/* Hours + details */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-16">
            <div className="bg-neutral-50 rounded-[28px] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Clock size={18} className="text-primary" />
                <h3 className="font-black text-secondary">Режим работы</h3>
              </div>
              <div className="space-y-3">
                {[
                  { day: "Время работы", hours: hoursWeekdays },
                  { day: "MAX / чат", hours: "24 / 7" },
                ].map((row) => (
                  <div key={row.day} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                    <span className="text-sm font-bold text-neutral-500">{row.day}</span>
                    <span className="text-sm font-black text-secondary">{row.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-50 rounded-[28px] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Building2 size={18} className="text-primary" />
                <h3 className="font-black text-secondary">Реквизиты</h3>
              </div>
              <div className="space-y-3">
                {requisites.map((row) => (
                  <div key={row.label}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">{row.label}</p>
                    <p className="text-sm font-bold text-secondary">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-50 rounded-[28px] p-8">
              <h3 className="font-black text-secondary mb-4">По вопросам сотрудничества</h3>
              <div className="space-y-3">
                <a href={`tel:+${partnerPhone.replace(/\D/g, "")}`} className="block text-sm font-bold text-secondary hover:text-primary transition-colors">
                  Тел.: {partnerPhone}
                </a>
                <a href={`mailto:${partnerEmail}`} className="block text-sm font-bold text-secondary hover:text-primary transition-colors">
                  E-mail: {partnerEmail}
                </a>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}
