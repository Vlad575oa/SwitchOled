import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createOrderAction } from "@/lib/actions";
import { buildRateLimitKey, rateLimit } from "@/lib/rateLimit";

const Schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(10).max(24).refine((value) => value.replace(/\D/g, "").length === 11, "Введите полный номер телефона"),
  productId: z.number().int().positive(),
  consent: z.literal(true),
  yandexClientId: z.string().trim().max(120).optional(),
  yclid: z.string().trim().max(255).optional(),
});

export async function POST(request: Request) {
  try {
    const limit = rateLimit(buildRateLimitKey("quick-order", request), 5, 10 * 60 * 1000);
    if (!limit.allowed) return NextResponse.json({ error: "Попробуйте ещё раз через несколько минут" }, { status: 429 });

    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Введите полный телефон и подтвердите согласие" }, { status: 400 });

    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, isVisible: { not: false } },
      select: { id: true, price: true, inStock: true },
    });
    if (!product) return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    if (!product.inStock) return NextResponse.json({ error: "Товар временно отсутствует" }, { status: 400 });

    const result = await createOrderAction({
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: "Быстрый заказ — адрес уточнить по телефону",
      comment: "Заявка «Заказать в 1 клик»",
      yandexClientId: parsed.data.yandexClientId,
      yclid: parsed.data.yclid,
      items: [{ productId: product.id, quantity: 1 }],
    });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

    await prisma.order.update({ where: { id: result.data.id }, data: { source: "quick_order" } });
    return NextResponse.json({ success: true, orderId: result.data.id });
  } catch (error) {
    console.error("Quick order error", error);
    return NextResponse.json({ error: "Не удалось отправить заявку" }, { status: 500 });
  }
}
