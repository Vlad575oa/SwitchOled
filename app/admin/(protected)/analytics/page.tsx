import prisma from "@/lib/prisma";
import { Eye, Home, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [homeViews, productViews, top] = await Promise.all([
    prisma.pageView.count({ where: { pageType: "home", createdAt: { gte: since } } }),
    prisma.pageView.count({ where: { pageType: "product", createdAt: { gte: since } } }),
    prisma.pageView.groupBy({ by: ["productId"], where: { pageType: "product", createdAt: { gte: since }, productId: { not: null } }, _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 20 }),
  ]);
  const ids = top.flatMap((item) => item.productId ? [item.productId] : []);
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, slug: true } });
  const names = new Map(products.map((p) => [p.id, p]));
  return <>
    <header className="bg-white border-b border-neutral-100 px-8 py-5"><h1 className="text-xl font-black text-[#111827]">Аналитика просмотров</h1><p className="text-xs text-neutral-400 font-bold mt-0.5">Последние 30 дней</p></header>
    <div className="p-8 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6"><div className="flex items-center gap-3 mb-3"><Home size={18} className="text-blue-500" /><p className="text-xs font-black uppercase tracking-widest text-neutral-400">Главная</p></div><p className="text-3xl font-black text-[#111827]">{homeViews}</p><p className="mt-1 text-xs font-bold text-neutral-400">просмотров</p></div><div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6"><div className="flex items-center gap-3 mb-3"><Package size={18} className="text-orange-500" /><p className="text-xs font-black uppercase tracking-widest text-neutral-400">Карточки товаров</p></div><p className="text-3xl font-black text-[#111827]">{productViews}</p><p className="mt-1 text-xs font-bold text-neutral-400">просмотров</p></div></div><div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden"><div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-3"><Eye size={17} className="text-primary" /><h2 className="text-sm font-black text-[#111827]">Самые просматриваемые товары</h2></div><div className="p-6">{top.length === 0 ? <p className="py-8 text-center text-sm font-bold text-neutral-400">Данные появятся после первых просмотров</p> : <div className="space-y-3">{top.map((item, index) => { const product = item.productId ? names.get(item.productId) : null; return <div key={item.productId ?? index} className="flex items-center gap-3"><span className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-black text-neutral-500">{index + 1}</span><p className="flex-1 text-sm font-bold text-[#111827] truncate">{product?.name ?? `Товар #${item.productId}`}</p><span className="text-sm font-black text-primary">{item._count.id}</span></div>; })}</div>}</div></div></div>
  </>;
}
