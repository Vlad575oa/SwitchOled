import prisma from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { PhoneCall } from "lucide-react";
import { OrderStatusSelect } from "../orders/OrderStatusSelect";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "Ожидает звонка", cls: "bg-yellow-100 text-yellow-700" },
  processing: { label: "В работе", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "Выполнен", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Отменён", cls: "bg-red-100 text-red-600" },
};

export default async function QuickOrdersPage() {
  const orders = await prisma.order.findMany({ where: { source: "quick_order" }, include: { items: { include: { product: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } });
  return <>
    <header className="bg-white border-b border-neutral-100 px-8 py-5"><h1 className="text-xl font-semibold text-[#111111]">Заказы в 1 клик</h1><p className="text-xs text-neutral-400 font-bold mt-0.5">Заявки на обратный звонок · {orders.length}</p></header>
    <div className="p-8"><div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-neutral-100">{["#", "Клиент", "Телефон", "Товар", "Цена", "Статус", "Дата"].map((h) => <th key={h} className="px-5 py-3.5 text-[9px] font-semibold uppercase tracking-widest text-neutral-400">{h}</th>)}</tr></thead><tbody>{orders.length === 0 ? <tr><td colSpan={7} className="px-5 py-20 text-center"><PhoneCall size={40} className="mx-auto mb-3 text-neutral-200" /><p className="text-neutral-400 font-bold text-sm">Заявок пока нет</p></td></tr> : orders.map((order) => { const s = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-neutral-100 text-neutral-500" }; return <tr key={order.id} className="border-b border-neutral-50 last:border-0"><td className="px-5 py-4 text-xs font-bold">#{order.id}</td><td className="px-5 py-4 text-xs font-bold">{order.name}</td><td className="px-5 py-4 text-xs font-bold">{order.phone}</td><td className="px-5 py-4 text-xs font-bold">{order.items.map((item) => `${item.product.name} × ${item.quantity}`).join(", ")}</td><td className="px-5 py-4 text-xs font-semibold">{formatPrice(order.totalAmount)}</td><td className="px-5 py-4"><OrderStatusSelect orderId={order.id} status={order.status} statusMap={STATUS_MAP} /></td><td className="px-5 py-4 text-xs font-bold text-neutral-500 whitespace-nowrap">{new Date(order.createdAt).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}</td></tr>; })}</tbody></table></div></div></div>
  </>;
}
