"use client";

import { MessageCircle, Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";
import { CONTACTS } from "@/lib/constants/contacts";
import { SupportChat } from "@/components/SupportChat";
import { InfoPageShell, InfoHero, Section } from "@/components/info/InfoKit";
import { Accordion } from "@/components/info/Accordion";

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
  const hours = data.hours_weekdays ?? "09:00 — 20:00";

  const channels = [
    { icon: Phone, label: "Позвонить", value: phone, sub: `Ежедневно ${hours}`, href: phoneHref, dark: true },
    { icon: MessageCircle, label: "Написать в MAX", value: "Ответим в течение 15 минут", sub: "В рабочее время", href: maxHref },
    { icon: Mail, label: "Email", value: email, sub: "Ответим в течение 2 часов", href: `mailto:${email}` },
    { icon: MapPin, label: "Шоурум", value: address, sub: "м. Митино, 5 минут пешком", href: CONTACTS.yandexMapsUrl },
  ];

  const requisites = [
    { label: "Компания", value: data.company_name ?? "ИП Якубов Р.В." },
    { label: "ФИО", value: data.full_name ?? "Якубов Руслан Вячеславович" },
    { label: "ИНН", value: data.inn ?? "773370847288" },
    { label: "ОГРНИП", value: data.ogrnip ?? "323774600158589" },
    { label: "Адрес", value: data.legal_address ?? "125368, Россия, г. Москва" },
  ];

  const partnerPhone = data.partner_phone ?? "8 (926) 676-34-88";
  const partnerEmail = data.partner_email ?? CONTACTS.email;

  return (
    <InfoPageShell>
      <InfoHero
        eyebrow="Контакты"
        title="Мы на связи каждый день"
        lead={`С ${hours.replace(" — ", " до ")} — по телефону, в чате или в шоуруме. Поможем выбрать консоль и решим любой вопрос по заказу.`}
      />

      <Section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {channels.map(({ icon: Icon, label, value, sub, href, dark }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`group rounded-2xl p-6 flex flex-col gap-5 transition-colors ${dark ? "bg-black text-white hover:bg-[#1c1c1c]" : "bg-surface-soft text-black hover:bg-[#ececec]"}`}
            >
              <div className="flex items-center justify-between">
                <Icon size={24} strokeWidth={1.6} />
                <ArrowUpRight size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className={`text-[14px] ${dark ? "text-white/60" : "text-black/50"}`}>{label}</p>
                <p className="mt-1 text-[17px] font-semibold leading-[1.3] break-words">{value}</p>
                <p className={`mt-1 text-[14px] ${dark ? "text-white/60" : "text-black/50"}`}>{sub}</p>
              </div>
            </a>
          ))}
        </div>
      </Section>

      <SupportChat className="rounded-3xl" />

      <Section title="Дополнительно">
        <Accordion
          items={[
            {
              title: "Как добраться до шоурума",
              content: (
                <p>
                  {address}, рядом с м. Митино (около 5 минут пешком). Работаем ежедневно {hours}.{" "}
                  <a href={CONTACTS.yandexMapsUrl} target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-4">
                    Открыть на карте
                  </a>
                </p>
              ),
            },
            {
              title: "Реквизиты",
              content: (
                <dl className="grid grid-cols-[110px_1fr] gap-y-2">
                  {requisites.map((r) => (
                    <div key={r.label} className="contents">
                      <dt className="text-black/45">{r.label}</dt>
                      <dd className="text-black">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              ),
            },
            {
              title: "Сотрудничество",
              content: (
                <p>
                  По вопросам партнёрства и оптовых поставок:{" "}
                  <a href={`tel:+${partnerPhone.replace(/\D/g, "")}`} className="text-black underline underline-offset-4">{partnerPhone}</a>
                  {" · "}
                  <a href={`mailto:${partnerEmail}`} className="text-black underline underline-offset-4">{partnerEmail}</a>
                </p>
              ),
            },
          ]}
        />
      </Section>
    </InfoPageShell>
  );
}
