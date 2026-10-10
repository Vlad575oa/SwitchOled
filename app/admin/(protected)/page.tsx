import prisma from "@/lib/prisma";
import Link from "next/link";
import { Package, ShoppingBag, FileText, TrendingUp, Plus, ArrowRight, Clock, ShoppingCart, LayoutGrid, Eye } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { groupCartEventsByDate } from "@/lib/admin/cartEventStats";
import { ClearCartEventsButton } from "./ClearCartEventsButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let productsCount = 0, ordersCount = 0, postsCount = 0, recentOrders: any[] = [], monthRevenue = 0;
  let cartTotal = 0, cartGrid = 0, cartPage = 0;
  let topCartProducts: { productId: number; _count: { id: number }; name?: string }[] = [];
  let topArticleViews: { path: string; _count: { id: number }; title: string }[] = [];
  let cartByDate: ReturnType<typeof groupCartEventsByDate> = [];
  let dbError = false;
  try {
    const [pc, oc, bc, ro, revenue, cartAll, cartGridCount, cartPageCount, topCart, cartEvents, topArticles] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.post.count(),
      prisma.order.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
      prisma.order.aggregate({ where: { status: "paid" }, _sum: { totalAmount: true } }),
      prisma.cartEvent.count(),
      prisma.cartEvent.count({ where: { source: "catalog_grid" } }),
      prisma.cartEvent.count({ where: { source: "product_page" } }),
      prisma.cartEvent.groupBy({
        by: ["productId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.cartEvent.findMany({
        select: { createdAt: true, source: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.pageView.groupBy({
        by: ["path"],
        where: { pageType: "article" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);
    productsCount = pc; ordersCount = oc; postsCount = bc; recentOrders = ro;
    monthRevenue = revenue._sum.totalAmount ?? 0;
    cartTotal = cartAll; cartGrid = cartGridCount; cartPage = cartPageCount;
    cartByDate = groupCartEventsByDate(cartEvents).slice(0, 14);

    // Подгружаем имена товаров
    const productIds = topCart.map((r) => r.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const nameMap = Object.fromEntries(products.map((p) => [p.id, p.name]));
    topCartProducts = topCart.map((r) => ({ ...r, name: nameMap[r.productId] }));

    const articleSlugs = topArticles.map((item) => item.path.replace(/^\/blog\//, "").split("?")[0]);
    const posts = await prisma.post.findMany({
      where: { slug: { in: articleSlugs } },
      select: { slug: true, title: true },
    });
    const titleMap = new Map(posts.map((post) => [post.slug, post.title]));
    topArticleViews = topArticles.map((item) => {
      const slug = articleSlugs.find((candidate) => `/blog/${candidate}` === item.path) ?? item.path;
      return { ...item, title: titleMap.get(slug) ?? item.path };
    });
  } catch {
    dbError = true;
  }

  const statusLabel: Record<string, { label: string; cls: string }> = {
    pending: { label: "Ожидает", cls: "bg-yellow-100 text-yellow-700" },
    paid: { label: "Оплачен", cls: "bg-green-100 text-green-700" },
    failed: { label: "Отменён", cls: "bg-red-100 text-red-600" },
    success: { label: "Выполнен", cls: "bg-blue-100 text-blue-700" },
  };

  return (
    <>
      {/* Top bar */}
      <header className="bg-white border-b border-neutral-100 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#111827]">Дашборд</h1>
          <p className="text-xs text-neutral-400 font-bold mt-0.5">Обзор магазина</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-primary text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={14} /> Новый товар
        </Link>
      </header>

      <div className="p-8 space-y-8">
        {dbError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-sm font-bold text-red-600">
            База данных недоступна. Данные не загружены — попробуйте обновить страницу через несколько минут.
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            { label: "Товаров", value: productsCount, icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Заказов", value: ordersCount, icon: ShoppingBag, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "Статей в блоге", value: postsCount, icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "Выручка (оплачено)", value: formatPrice(monthRevenue), icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{stat.label}</p>
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon size={16} className={stat.color} />
                </div>
              </div>
              <p className="text-2xl font-black text-[#111827]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Cart events stats */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <ShoppingCart size={15} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#111827]">Положили в корзину</h2>
              <p className="text-[10px] text-neutral-400 font-bold">Собственная статистика сайта</p>
            </div>
          </div>
          <ClearCartEventsButton />
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-neutral-50 rounded-xl p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Всего</p>
                <p className="text-2xl font-black text-[#111827]">{cartTotal}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <LayoutGrid size={11} className="text-orange-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Из сетки</p>
                </div>
                <p className="text-2xl font-black text-orange-600">{cartGrid}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ShoppingCart size={11} className="text-blue-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Из карточки</p>
                </div>
                <p className="text-2xl font-black text-blue-600">{cartPage}</p>
              </div>
            </div>

            {cartByDate.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">По датам добавления</p>
                <div className="overflow-hidden rounded-xl border border-neutral-100">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50">
                      <tr>
                        {["Дата", "Всего", "Из сетки", "Из карточки"].map((h) => (
                          <th key={h} className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-neutral-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cartByDate.map((item) => (
                        <tr key={item.dateKey} className="border-t border-neutral-100 first:border-t-0">
                          <td className="px-4 py-3 text-xs font-black text-[#111827]">{item.dateLabel}</td>
                          <td className="px-4 py-3 text-xs font-black text-[#111827]">{item.total}</td>
                          <td className="px-4 py-3 text-xs font-bold text-orange-600">{item.grid}</td>
                          <td className="px-4 py-3 text-xs font-bold text-blue-600">{item.page}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {topCartProducts.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">Топ товаров по кликам</p>
                <div className="space-y-2">
                  {topCartProducts.map((item, i) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-neutral-100 text-[10px] font-black text-neutral-400 flex items-center justify-center shrink-0">{i + 1}</span>
                      <p className="flex-1 text-xs font-bold text-[#111827] truncate">{item.name ?? `Товар #${item.productId}`}</p>
                      <span className="text-xs font-black text-orange-600 shrink-0">{item._count.id} раз</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cartTotal === 0 && (
              <p className="text-center text-xs text-neutral-400 font-bold py-4">
                Данных пока нет — статистика накапливается с момента деплоя
              </p>
            )}
          </div>
        </div>

        {/* Top blog articles */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <Eye size={15} className="text-purple-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#111827]">Топ-5 статей по переходам</h2>
              <p className="text-[10px] text-neutral-400 font-bold">За всё время · собственная статистика сайта</p>
            </div>
          </div>
          <div className="p-6">
            {topArticleViews.length === 0 ? (
              <p className="py-4 text-center text-xs text-neutral-400 font-bold">
                Данные появятся после первых переходов на статьи
              </p>
            ) : (
              <div className="space-y-3">
                {topArticleViews.map((item, index) => (
                  <div key={item.path} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-neutral-100 text-xs font-black text-neutral-500 flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-sm font-bold text-[#111827] truncate hover:text-primary transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </a>
                    <span className="text-sm font-black text-primary shrink-0">{item._count.id} переходов</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { href: "/admin/products/new", label: "Добавить товар", desc: "Создать новую позицию" },
            { href: "/admin/posts/new", label: "Написать статью", desc: "Новая запись в блог" },
            { href: "/admin/faq", label: "Управление FAQ", desc: "Редактировать вопросы" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="bg-white border border-neutral-100 rounded-2xl shadow-sm p-5 flex items-center justify-between group hover:border-primary/20 hover:shadow-md transition-all">
              <div>
                <p className="text-sm font-black text-[#111827]">{l.label}</p>
                <p className="text-[11px] text-neutral-400 font-bold mt-0.5">{l.desc}</p>
              </div>
              <ArrowRight size={16} className="text-neutral-300 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-[#111827]">Последние заказы</h2>
            <Link href="/admin/orders" className="text-xs font-black text-primary hover:text-red-700 flex items-center gap-1">
              Все заказы <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-50">
                  {["ID", "Клиент", "Телефон", "Сумма", "Статус", "Дата"].map((h) => (
                    <th key={h} className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-neutral-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-neutral-400 text-sm font-bold">
                      <Clock className="mx-auto mb-2 text-neutral-200" size={32} />
                      Заказов пока нет
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const s = statusLabel[order.status] ?? { label: order.status, cls: "bg-neutral-100 text-neutral-500" };
                    return (
                      <tr key={order.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-black text-[#111827]">#{order.id}</td>
                        <td className="px-6 py-4 text-xs font-bold text-neutral-600">{order.name}</td>
                        <td className="px-6 py-4 text-xs font-bold text-neutral-400">{order.phone}</td>
                        <td className="px-6 py-4 text-xs font-black text-[#111827]">{formatPrice(order.totalAmount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.cls}`}>{s.label}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-neutral-400">
                          {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
