import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { aiMatchBatch } from "@/lib/priceCompare/aiMatch";

// Батч-сопоставление ИИ (DeepSeek) для pending-строк конкретной загрузки прайса.
// Не связано с чат-ботом "Кира" — отдельный вызов DeepSeek с собственным промптом.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uploadId = Number(params.id);

  const pendingEntries = await prisma.priceEntry.findMany({
    where: { uploadId, matchStatus: "pending" },
    select: { id: true, rawName: true, normalizedName: true, platform: true },
  });

  if (pendingEntries.length === 0) {
    return NextResponse.json({ matched: 0, created: 0, skipped: 0 });
  }

  const games = await prisma.game.findMany({ select: { id: true, canonicalName: true, platform: true } });

  let decisions;
  try {
    decisions = await aiMatchBatch(
      pendingEntries.map((e) => ({
        entryId: e.id,
        rawName: e.rawName,
        normalizedName: e.normalizedName,
        platform: e.platform,
      })),
      games
    );
  } catch (e) {
    console.error("resolve-pending error", e);
    return NextResponse.json({ error: "ИИ-сервис недоступен" }, { status: 503 });
  }

  let matched = 0;
  let created = 0;
  let skipped = 0;

  for (const decision of decisions) {
    const entry = pendingEntries.find((e) => e.id === decision.entryId);
    if (!entry) continue;

    if (decision.action === "skip") {
      skipped++;
      continue;
    }

    let gameId: number;
    if (decision.action === "match") {
      gameId = decision.gameId;
    } else {
      // region — nullable, поэтому compound-уникальность через upsert недоступна (Prisma не считает null равным null для unique lookup)
      const existingGame = await prisma.game.findFirst({
        where: { canonicalName: decision.canonicalName, platform: decision.platform, region: null },
      });
      const game =
        existingGame ??
        (await prisma.game.create({ data: { canonicalName: decision.canonicalName, platform: decision.platform } }));
      gameId = game.id;
      if (!existingGame) created++;
    }

    await prisma.gameAlias.upsert({
      where: { normalized: entry.normalizedName },
      update: { gameId },
      create: { gameId, rawText: entry.rawName, normalized: entry.normalizedName, source: "ai" },
    });

    await prisma.priceEntry.update({
      where: { id: entry.id },
      data: { gameId, matchStatus: "confirmed" },
    });

    if (decision.action === "match") matched++;
  }

  return NextResponse.json({ matched, created, skipped });
}
