import prisma from "@/lib/prisma";
import { CalendarDays, Eye, Home, Package } from "lucide-react";
import YandexDirectPanel from "./YandexDirectPanel";

export const dynamic = "force-dynamic";

function getMoscowDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function AnalyticsPage() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [homeViews, productViews, top, views] = await Promise.all([
    prisma.pageView.count({ where: { pageType: "home", createdAt: { gte: since } } }),
    prisma.pageView.count({ where: { pageType: "product", createdAt: { gte: since } } }),
    prisma.pageView.groupBy({ by: ["productId"], where: { pageType: "product", createdAt: { gte: since }, productId: { not: null } }, _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 20 }),
    prisma.pageView.findMany({ where: { createdAt: { gte: since } }, select: { pageType: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const daily = new Map<string, { home: number; product: number }>();
  for (const view of views) {
    const key = getMoscowDateKey(view.createdAt);
    const row = daily.get(key) ?? { home: 0, product: 0 };
    if (view.pageType === "home") row.home += 1;
    if (view.pageType === "product") row.product += 1;
    daily.set(key, row);
  }
  const dailyRows = Array.from(daily.entries()).sort(([a], [b]) => b.localeCompare(a));
  const ids = top.flatMap((item) => item.productId ? [item.productId] : []);
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, slug: true } });
  const names = new Map(products.map((p) => [p.id, p]));
  return <>
    <header className="bg-white border-b border-neutral-100 px-8 py-5"><h1 className="text-xl font-black text-[#111827]">Аналитика просмотров</h1><p className="text-xs text-neutral-400 font-bold mt-0.5">Последние 30 дней</p></header>
    <div className="p-8 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6"><div className="flex items-center gap-3 mb-3"><Home size={18} className="text-blue-500" /><p className="text-xs font-black uppercase tracking-widest text-neutral-400">Главная</p></div><p className="text-3xl font-black text-[#111827]">{homeViews}</p><p className="mt-1 text-xs font-bold text-neutral-400">просмотров</p></div><div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6"><div className="flex items-center gap-3 mb-3"><Package size={18} className="text-orange-500" /><p className="text-xs font-black uppercase tracking-widest text-neutral-400">Карточки товаров</p></div><p className="text-3xl font-black text-[#111827]">{productViews}</p><p className="mt-1 text-xs font-bold text-neutral-400">просмотров</p></div></div><div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden"><div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-3"><CalendarDays size={17} className="text-primary" /><h2 className="text-sm font-black text-[#111827]">Просмотры по датам</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead className="bg-neutral-50"><tr>{["Дата", "Главная", "Товары", "Всего"].map((heading) => <th key={heading} className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-neutral-400">{heading}</th>)}</tr></thead><tbody>{dailyRows.length === 0 ? <tr><td colSpan={4} className="px-6 py-8 text-center text-sm font-bold text-neutral-400">Данных пока нет</td></tr> : dailyRows.map(([date, row]) => <tr key={date} className="border-t border-neutral-100"><td className="px-6 py-3 text-xs font-black text-[#111827]">{formatDate(date)}</td><td className="px-6 py-3 text-xs font-bold text-blue-600">{row.home}</td><td className="px-6 py-3 text-xs font-bold text-orange-600">{row.product}</td><td className="px-6 py-3 text-xs font-black text-[#111827]">{row.home + row.product}</td></tr>)}</tbody></table></div></div><div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden"><div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-3"><Eye size={17} className="text-primary" /><h2 className="text-sm font-black text-[#111827]">Самые просматриваемые товары</h2></div><div className="p-6">{top.length === 0 ? <p className="py-8 text-center text-sm font-bold text-neutral-400">Данные появятся после первых просмотров</p> : <div className="space-y-3">{top.map((item, index) => { const product = item.productId ? names.get(item.productId) : null; return <div key={item.productId ?? index} className="flex items-center gap-3"><span className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-black text-neutral-500">{index + 1}</span><p className="flex-1 text-sm font-bold text-[#111827] truncate">{product?.name ?? `Товар #${item.productId}`}</p><span className="text-sm font-black text-primary">{item._count.id}</span></div>; })}</div>}</div></div></div>
    <YandexDirectPanel />
  </>;
}
