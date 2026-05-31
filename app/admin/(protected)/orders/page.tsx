import prisma from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import { OrderStatusSelect } from "./OrderStatusSelect";
import { OrderDeleteButton } from "./OrderDeleteButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "Ожидает", cls: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Оплачен", cls: "bg-green-100 text-green-700" },
  failed: { label: "Отменён", cls: "bg-red-100 text-red-600" },
  success: { label: "Выполнен", cls: "bg-blue-100 text-blue-700" },
};

export default async function OrdersPage() {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  const canDeleteOrders = session?.r !== "MANAGER";

  const orders = await prisma.order.findMany({
    include: { items: { include: { product: { select: { name: true, sku: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <header className="bg-white border-b border-neutral-100 px-8 py-5">
        <h1 className="text-xl font-black text-[#111827]">Заказы</h1>
        <p className="text-xs text-neutral-400 font-bold mt-0.5">{orders.length} заказов</p>
      </header>

      <div className="p-8">
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100">
                {["#", "Клиент", "Телефон", "Адрес", "Комментарий", "Товары", "Сумма", "Статус", "Дата", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-20 text-center">
                    <ShoppingBag size={40} className="mx-auto mb-3 text-neutral-200" />
                    <p className="text-neutral-400 font-bold text-sm">Заказов пока нет</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const s = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-neutral-100 text-neutral-500" };
                  return (
                    <tr key={order.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                      <td className="px-5 py-4 text-xs font-bold text-neutral-700">#{order.id}</td>
                      <td className="px-5 py-4 text-xs font-bold text-neutral-700">{order.name}</td>
                      <td className="px-5 py-4 text-xs font-bold text-neutral-700">
                        <div className="flex items-center gap-2 group">
                          <span>{order.phone}</span>
                          <CopyButton text={order.phone} className="opacity-0 group-hover:opacity-100" />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-neutral-700 min-w-[280px] whitespace-normal break-words">
                        <div className="flex items-start gap-2 group">
                          <span className="flex-1">{order.address}</span>
                          <CopyButton text={order.address} className="opacity-0 group-hover:opacity-100 mt-[-2px]" />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-neutral-500 font-medium min-w-[180px] whitespace-normal break-words">
                        {order.comment || <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="px-5 py-4 min-w-[220px]">
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id}>
                              <p className="text-xs font-bold text-neutral-700 whitespace-normal">
                                {item.product.name} × {item.quantity}
                              </p>
                              {item.product.sku && (
                                <p className="text-xs font-bold text-neutral-400">
                                  Арт: {item.product.sku}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-neutral-700">{formatPrice(order.totalAmount)}</td>
                      <td className="px-5 py-4">
                        <OrderStatusSelect orderId={order.id} status={order.status} statusMap={STATUS_MAP} />
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-neutral-700 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        {canDeleteOrders ? (
                          <div className="flex items-center justify-end">
                            <OrderDeleteButton orderId={order.id} />
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
