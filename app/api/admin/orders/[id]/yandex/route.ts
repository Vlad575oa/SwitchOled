import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { uploadYandexOfflineConversion } from "@/lib/yandexMetrikaOffline";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orderId = Number(params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Некорректный ID заказа" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    if (!["paid", "completed"].includes(order.status)) {
      return NextResponse.json({ error: "Передача доступна после оплаты или завершения заказа" }, { status: 400 });
    }
    if (order.yandexConversionSentAt) {
      return NextResponse.json({ success: true, alreadySent: true, sentAt: order.yandexConversionSentAt });
    }

    const result = await uploadYandexOfflineConversion({
      orderId: order.id,
      dateTime: new Date(),
      clientId: order.yandexClientId,
      yclid: order.yclid,
      price: order.totalAmount,
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        yandexConversionSentAt: new Date(),
        yandexConversionUploadId: result.uploadId,
      },
      select: { yandexConversionSentAt: true, yandexConversionUploadId: true },
    });

    return NextResponse.json({ success: true, ...updated, target: result.target });
  } catch (error) {
    console.error("Yandex offline conversion error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось передать конверсию в Яндекс" },
      { status: 502 }
    );
  }
}
