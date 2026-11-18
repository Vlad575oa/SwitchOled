import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Phone } from "lucide-react";
import { CONTACTS } from "@/lib/constants/contacts";
import { cn } from "@/lib/utils";

// Shared building blocks for the informational pages (delivery, warranty, FAQ, …),
// so they all read as one calm monochrome system.

export function InfoPageShell({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-[1280px] mx-auto px-3 lg:px-6 pt-4 pb-16 lg:pb-24 space-y-3">{children}</div>;
}

export function InfoHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-surface-soft px-6 sm:px-10 lg:px-16 py-10 sm:py-14 lg:py-20">
      {eyebrow && <p className="text-[14px] text-black/50">{eyebrow}</p>}
      <h1 className="mt-2 max-w-[860px] text-[34px] sm:text-[44px] lg:text-[56px] font-semibold leading-[1.05] tracking-[-0.03em] text-black">
        {title}
      </h1>
      {lead && <p className="mt-5 max-w-[640px] text-[17px] sm:text-[19px] leading-[1.55] text-black/60">{lead}</p>}
      {children && <div className="mt-8">{children}</div>}
    </section>
  );
}

export function Section({
  title,
  lead,
  children,
  className,
}: {
  title?: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-3xl bg-white px-3 sm:px-6 lg:px-10 py-10 lg:py-14", className)}>
      {title && (
        <h2 className="text-[26px] sm:text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-black">{title}</h2>
      )}
      {lead && <p className="mt-3 max-w-[640px] text-[16px] leading-[1.6] text-black/55">{lead}</p>}
      <div className={cn(title || lead ? "mt-8" : "")}>{children}</div>
    </section>
  );
}

export function FactGrid({
  items,
  columns = 3,
}: {
  items: Array<{ icon?: LucideIcon; title: ReactNode; text?: ReactNode; meta?: ReactNode; dark?: boolean }>;
  columns?: 2 | 3 | 4;
}) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <div className={cn("grid grid-cols-1 gap-3", cols)}>
      {items.map(({ icon: Icon, title, text, meta, dark }, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl p-6 lg:p-7 flex flex-col",
            dark ? "bg-black text-white" : "bg-surface-soft text-black"
          )}
        >
          {Icon && <Icon size={24} strokeWidth={1.6} className={dark ? "text-white" : "text-black"} />}
          <p className={cn("text-[19px] font-semibold leading-[1.25] tracking-[-0.01em]", Icon && "mt-5")}>{title}</p>
          {text && <p className={cn("mt-2 text-[15px] leading-[1.6]", dark ? "text-white/65" : "text-black/60")}>{text}</p>}
          {meta && (
            <div className={cn("mt-auto pt-5 text-[14px]", dark ? "text-white/80" : "text-black/80")}>{meta}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function Steps({ items }: { items: Array<{ title: string; text: string }> }) {
  return (
    <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((s, i) => (
        <li key={s.title} className="rounded-2xl bg-surface-soft p-6">
          <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-black text-white text-[14px] font-semibold">
            {i + 1}
          </span>
          <p className="mt-5 text-[17px] font-semibold text-black">{s.title}</p>
          <p className="mt-2 text-[15px] leading-[1.6] text-black/60">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function HelpBand({
  title = "Остались вопросы?",
  text = "Ответим в чате или по телефону — подскажем с выбором, доставкой и настройкой консоли.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="rounded-3xl bg-[#0f0f10] text-white px-6 sm:px-10 lg:px-16 py-12 lg:py-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
      <div>
        <p className="text-[28px] sm:text-[34px] font-semibold tracking-[-0.02em] leading-[1.15]">{title}</p>
        <p className="mt-3 max-w-[520px] text-[16px] leading-[1.6] text-white/60">{text}</p>
        <p className="mt-2 text-[14px] text-white/45">Ежедневно 09:00–20:00</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/contacts#support-chat"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white text-black text-[15px] font-semibold hover:bg-white/85 transition-colors"
        >
          Написать в чат <ArrowUpRight size={17} />
        </Link>
        <a
          href={`tel:${CONTACTS.phoneHref}`}
          className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-white/25 text-white text-[15px] font-semibold hover:border-white transition-colors"
        >
          <Phone size={16} /> {CONTACTS.phoneDisplay}
        </a>
      </div>
    </section>
  );
}

export function PillLink({ href, children, dark }: { href: string; children: ReactNode; dark?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 h-12 px-6 rounded-full text-[15px] font-semibold transition-colors",
        dark ? "bg-black text-white hover:bg-[#2b2b2b]" : "border border-black/15 text-black hover:border-black"
      )}
    >
      {children}
    </Link>
  );
}
