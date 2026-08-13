import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

// Удаляет ошибочный алиас (например, если ИИ или нечёткий поиск неверно сопоставили строку прайса с игрой).
export async function DELETE(request: Request, { params }: { params: { id: string; aliasId: string } }) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const alias = await prisma.gameAlias.findUnique({ where: { id: Number(params.aliasId) } });
  if (!alias || alias.gameId !== Number(params.id)) {
    return NextResponse.json({ error: "Алиас не найден" }, { status: 404 });
  }

  await prisma.gameAlias.delete({ where: { id: alias.id } });
  await prisma.priceEntry.updateMany({
    where: { normalizedName: alias.normalized, gameId: Number(params.id) },
    data: { gameId: null, matchStatus: "pending" },
  });

  return NextResponse.json({ ok: true });
}
