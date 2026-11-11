import { NextResponse } from "next/server";
import { createOrderAction } from "@/lib/actions";
import { z } from "zod";
import { buildRateLimitKey, rateLimit } from "@/lib/rateLimit";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { SESSION_COOKIE, hashSessionToken } from "@/lib/auth";

const CheckoutSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(10).max(24),
  address: z.string().trim().min(6).max(240),
  comment: z.string().trim().max(500).optional(),
  yandexClientId: z.string().trim().max(120).optional(),
  yclid: z.string().trim().max(255).optional(),
  items: z.array(z.object({
    id: z.number().int().positive(),
    quantity: z.number().int().positive().max(20),
  })).min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const limit = rateLimit(buildRateLimitKey("checkout", req), 10, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ success: false, error: "Слишком много попыток. Попробуйте позже." }, { status: 429 });
    }
    const parsed = CheckoutSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Некорректные данные заказа" }, { status: 400 });
    }
    const { name, phone, address, comment, items } = parsed.data;
    const sessionToken = cookies().get(SESSION_COOKIE)?.value;
    let userId: number | null = null;

    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { id: hashSessionToken(sessionToken) },
        select: { userId: true, expires: true },
      });
      if (session && session.expires > new Date()) {
        userId = session.userId;
      }
    }

    // 1. Create Order via transaction-safe Action
    const result = await createOrderAction({
      name,
      phone,
      address,
      comment,
      userId,
      yandexClientId: parsed.data.yandexClientId,
      yclid: parsed.data.yclid,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const order = result.data;

    // Cash checkout flow: no payment gateway redirect.
    return NextResponse.json({
      success: true,
      data: {
        confirmationUrl: `/success?orderId=${order.id}`,
        orderId: order.id,
      },
    });
  } catch (error: any) {
    console.error("Checkout API Error:", error.message);
    return NextResponse.json({ success: false, error: "Ошибка при создании заказа. Попробуйте ещё раз." }, { status: 500 });
  }
}
