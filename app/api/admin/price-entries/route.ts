import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

// Список строк, требующих ручного подтверждения сопоставления с игрой.
export async function GET(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get("uploadId");

  const entries = await prisma.priceEntry.findMany({
    where: {
      matchStatus: "pending",
      ...(uploadId ? { uploadId: Number(uploadId) } : {}),
    },
    include: { upload: { include: { supplier: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Полный справочник игр сюда не отдаём — он может разрастись до тысяч записей,
  // а рендер такого списка внутри выпадающего списка на каждой из 200 строк
  // вешает браузер. Игру для конкретной строки ищут отдельным запросом
  // (см. GET /api/admin/games?search=...) по мере ввода.
  return NextResponse.json({ entries });
}
