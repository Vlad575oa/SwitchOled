import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

// Подтверждает сопоставление строки прайса с игрой — либо с существующей,
// либо создаёт новую и сохраняет alias, чтобы в следующий раз найти её без ручного вмешательства.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entryId = Number(params.id);
  const body = await request.json();

  const entry = await prisma.priceEntry.findUnique({ where: { id: entryId } });
  if (!entry) return NextResponse.json({ error: "Строка не найдена" }, { status: 404 });

  let gameId: number;

  if (body.gameId) {
    gameId = Number(body.gameId);
  } else if (body.newGame?.canonicalName && body.newGame?.platform) {
    const game = await prisma.game.create({
      data: {
        canonicalName: body.newGame.canonicalName.trim(),
        platform: body.newGame.platform,
        region: body.newGame.region || null,
      },
    });
    gameId = game.id;
  } else {
    return NextResponse.json({ error: "Укажите gameId или newGame" }, { status: 400 });
  }

  await prisma.gameAlias.upsert({
    where: { normalized: entry.normalizedName },
    update: { gameId },
    create: { gameId, rawText: entry.rawName, normalized: entry.normalizedName, source: "manual" },
  });

  const updated = await prisma.priceEntry.update({
    where: { id: entryId },
    data: { gameId, matchStatus: "confirmed" },
  });

  return NextResponse.json(updated);
}
