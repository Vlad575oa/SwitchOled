import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

const OrderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "processing", "shipped", "completed", "failed", "cancelled"]),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const parsed = OrderStatusSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
    }
    const { status } = parsed.data;
    const order = await prisma.order.update({
      where: { id: parseInt(params.id) },
      data: { status },
    });
    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.r === "MANAGER") {
      return NextResponse.json(
        { error: "У менеджера нет прав на удаление заказов" },
        { status: 403 }
      );
    }

    await prisma.order.delete({ where: { id: parseInt(params.id) } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
