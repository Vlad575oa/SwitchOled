import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const game = await prisma.game.findUnique({
    where: { id: Number(params.id) },
    include: {
      aliases: { orderBy: { createdAt: "desc" } },
      entries: {
        include: { upload: { include: { supplier: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!game) return NextResponse.json({ error: "Игра не найдена" }, { status: 404 });
  return NextResponse.json(game);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();
  const canonicalName = (body.canonicalName as string)?.trim();
  const platform = body.platform as string;
  const region = (body.region as string)?.trim() || null;

  if (!canonicalName || !platform) {
    return NextResponse.json({ error: "Название и платформа обязательны" }, { status: 400 });
  }

  try {
    const game = await prisma.game.update({
      where: { id },
      data: { canonicalName, platform, region },
    });
    return NextResponse.json(game);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Такая игра для этой платформы уже существует" }, { status: 409 });
    }
    console.error("games PUT error", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);

  // GameAlias ссылается на Game с ON DELETE RESTRICT — сначала удаляем алиасы,
  // строки прайсов (PriceEntry.gameId) просто обнулятся (ON DELETE SET NULL) и уйдут в очередь pending.
  await prisma.gameAlias.deleteMany({ where: { gameId: id } });
  await prisma.priceEntry.updateMany({ where: { gameId: id }, data: { gameId: null, matchStatus: "pending" } });
  await prisma.game.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
