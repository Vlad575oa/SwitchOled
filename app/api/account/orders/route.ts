import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  try {
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json([], { status: 401 });

    const session = await prisma.session.findUnique({
      where: { id: token },
      select: { userId: true, expires: true },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.json([], { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            price_at_purchase: true,
            product_name_at_purchase: true,
          },
        },
      },
    });

    const normalized = orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      totalAmount: order.totalAmount,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price_at_purchase,
        productName: item.product_name_at_purchase,
      })),
    }));

    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json([]);
  }
}
