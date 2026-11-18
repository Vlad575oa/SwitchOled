import { Metadata } from "next";
import {
  Users, ShieldCheck, Truck,
  Star, Zap, Heart, Trophy, ArrowRight, Award
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPageContent } from "@/lib/getPageContent";
import { HomePageLink } from "@/components/HomePageLink";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "О компании Switch OLED — прошитые консоли с гарантией" },
  description: "Switch OLED — магазин для тех, кто живёт играми. Основан в 2017 году командой геймеров. Только оригинальная техника, гарантия и поддержка 24/7.",
  alternates: { canonical: "/about" },
};

// Static icon map for stats
const STAT_ICONS = [Trophy, Users, Star, Zap, ShieldCheck, Award, Truck];

const VALUES_ICONS = [ShieldCheck, Heart, Truck, Users];

export default async function AboutPage() {
  const d = await getPageContent("about");

  // ── Build dynamic data arrays ────────────────────────────────────
  const stats = [
    { value: d.stat1_value ?? "7+", label: d.stat1_label ?? "лет на рынке", Icon: Trophy },
    { value: d.stat2_value ?? "12k+", label: d.stat2_label ?? "клиентов", Icon: Users },
    { value: d.stat3_value ?? "4.9", label: d.stat3_label ?? "рейтинг", Icon: Star },
  ];

  const timeline = [1, 2, 3, 4, 5].map((i) => ({
    year: d[`timeline_${i}_year`] ?? "",
    title: d[`timeline_${i}_title`] ?? "",
    desc: d[`timeline_${i}_desc`] ?? "",
  })).filter((t) => t.year);

  const values = [1, 2, 3, 4].map((i, idx) => ({
    Icon: VALUES_ICONS[idx],
    title: d[`values_${i}_title`] ?? "",
    desc: d[`values_${i}_desc`] ?? "",
  })).filter((v) => v.title);

  return (
    <div className="bg-[#fcfcfc] min-h-screen pt-12 pb-28">
      <div className="container max-w-[1400px] px-4 lg:px-12">

        {/* ── HERO ───────────────────────────────────────────────── */}
        <div className="mb-32">
          <div className="mb-8">
            <HomePageLink />
          </div>
          {/* Top Metadata */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px w-12 bg-primary/30" />
            <span className="text-[12px] font-black text-primary uppercase tracking-[0.3em]">
              {d.hero_label ?? "История бренда"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Left Content */}
            <div className="lg:col-span-7">
              <h1 className="text-[clamp(3.5rem,10vw,8.5rem)] font-black tracking-tighter text-secondary leading-[0.82] uppercase mb-10">
                {d.hero_title ?? "Живём"}{" "}
                <span className="text-primary italic">играми</span>
                <br />
                {d.hero_subtitle ?? "с 2017 года"}
              </h1>

              <div className="max-w-xl md:max-w-2xl space-y-6">
                <p className="text-xl md:text-3xl text-secondary font-black leading-[1.3] tracking-tight">
                  {d.hero_text1 ?? "Switch OLED начинался с двух друзей и десяти консолей, привезённых из Европы."}
                </p>
                <div className="h-px w-20 bg-neutral-100" />
                <p className="text-base md:text-xl text-neutral-500 font-bold leading-relaxed">
                  {d.hero_text2 ?? "Сегодня — это команда из 15 профессиональных геймеров и более 12 000 клиентов."}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-8 md:gap-12 pt-6">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <p className="text-2xl md:text-4xl font-black text-secondary leading-none mb-1">{s.value}</p>
                      <p className="text-[10px] md:text-[12px] font-black text-neutral-400 uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Image */}
            <div className="lg:col-span-5 pt-8">
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden shadow-2xl shadow-neutral-200">
                <Image
                  src="/about_hero_cinematic.png"
                  alt="Switch OLED Heritage"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* ── MISSION (dark block) ─────────────────────────────────── */}
        <div className="mb-32">
          <div className="bg-[#1a1a1c] rounded-[64px] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-8">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] block mb-6 px-1">
                  Миссия и ценности
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] mb-10 max-w-2xl">
                  {d.mission_quote ?? "«Мы не хотели быть просто магазином.»"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <p className="text-neutral-400 text-sm font-bold leading-relaxed">
                    {d.mission_text1}
                  </p>
                  <p className="text-neutral-400 text-sm font-bold leading-relaxed">
                    {d.mission_text2}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-4 flex items-center justify-center lg:justify-end">
                <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center text-primary animate-pulse">
                  <Heart size={32} fill="currentColor" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TIMELINE ─────────────────────────────────────────────── */}
        {timeline.length > 0 && (
          <div className="mb-32">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-black text-secondary uppercase tracking-tighter">Как мы росли</h2>
              <div className="hidden md:block text-[10px] font-black text-neutral-300 uppercase tracking-widest">
                {timeline[0]?.year} — {timeline[timeline.length - 1]?.year}
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-[31px] top-6 bottom-6 w-px bg-neutral-100 hidden md:block" />
              <div className="space-y-4">
                {timeline.map((item) => (
                  <div key={item.year} className="md:pl-20 relative group">
                    <div className="hidden md:flex absolute left-0 top-6 w-16 h-16 rounded-full bg-white border border-neutral-100 items-center justify-center z-10 transition-all duration-500 group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/20 group-hover:scale-110">
                      <span className="text-[11px] font-black text-secondary group-hover:text-primary transition-colors">{item.year}</span>
                    </div>

                    <div className="bg-white rounded-lg p-8 border border-neutral-100/60 hover:border-primary/20 hover:shadow-2xl hover:shadow-neutral-200/50 transition-all duration-500">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="md:hidden text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full">{item.year}</span>
                        <h3 className="text-xl font-black text-secondary uppercase tracking-tight">{item.title}</h3>
                      </div>
                      <p className="text-neutral-500 font-medium leading-relaxed max-w-3xl">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VALUES ───────────────────────────────────────────────── */}
        {values.length > 0 && (
          <div className="mb-32">
            <div className="max-w-2xl mb-12">
              <h2 className="text-4xl font-black text-secondary uppercase tracking-tighter mb-4">Наши принципы</h2>
              <p className="text-neutral-400 font-bold">Мы не просто магазин электроники. Мы — часть игрового наследия.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((v) => (
                <div key={v.title} className="group p-10 rounded-lg bg-white border border-neutral-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-neutral-200/40 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="w-14 h-14 rounded-2xl bg-neutral-50 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                    <v.Icon size={24} className="text-neutral-300 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-black text-secondary mb-4 uppercase tracking-tight">{v.title}</h3>
                  <p className="text-neutral-500 font-medium leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <div className="bg-secondary rounded-[56px] p-12 md:p-20 flex flex-col lg:flex-row items-center justify-between gap-12 border border-secondary shadow-2xl shadow-neutral-900/10">
          <div className="max-w-md">
            <h3 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase leading-none">
              {d.cta_title ?? "Готовы к новой главе?"}
            </h3>
            <p className="text-neutral-400 font-bold text-lg">
              {d.cta_subtitle ?? "Загляните в каталог или свяжитесь с нашими экспертами."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full lg:w-auto">
            <Link
              href="/catalog/all"
              className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 h-16 bg-primary text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30"
            >
              В каталог
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/contacts"
              className="flex-1 lg:flex-none flex items-center justify-center px-10 h-16 bg-white/[0.03] border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/[0.08] transition-all"
            >
              Связаться с нами
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
