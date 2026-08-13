import prisma from "@/lib/prisma";
import { aiMatchOneBatch, chunk, AI_MATCH_BATCH_SIZE } from "./aiMatch";

export type ResolvePendingResult = { matched: number; created: number; skipped: number; stopped: boolean };

/**
 * Батч-сопоставление ИИ (DeepSeek) для явно переданного набора pending-строк.
 * Обрабатывает по одному батчу за раз и сразу применяет результат к БД — если
 * запрос остановлен (клиент нажал "Стоп" или истёк таймаут), уже обработанные
 * батчи не пропадают, а необработанные просто не отправляются в DeepSeek —
 * это и есть экономия токенов при остановке.
 */
export async function resolvePendingWithAi(entryIds: number[], signal?: AbortSignal): Promise<ResolvePendingResult> {
  const pendingEntries = await prisma.priceEntry.findMany({
    where: { id: { in: entryIds }, matchStatus: "pending" },
    select: { id: true, rawName: true, normalizedName: true, platform: true },
  });

  if (pendingEntries.length === 0) return { matched: 0, created: 0, skipped: 0, stopped: false };

  const games = await prisma.game.findMany({ select: { id: true, canonicalName: true, platform: true } });
  const batches = chunk(pendingEntries, AI_MATCH_BATCH_SIZE);

  let matched = 0;
  let created = 0;
  let skipped = 0;
  let stopped = false;

  for (const batch of batches) {
    if (signal?.aborted) {
      stopped = true;
      break;
    }

    let decisions;
    try {
      decisions = await aiMatchOneBatch(
        batch.map((e) => ({ entryId: e.id, rawName: e.rawName, normalizedName: e.normalizedName, platform: e.platform })),
        games,
        signal
      );
    } catch (e) {
      if (signal?.aborted) {
        stopped = true;
        break;
      }
      throw e;
    }

    for (const decision of decisions) {
      const entry = batch.find((e) => e.id === decision.entryId);
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
        games.push({ id: game.id, canonicalName: game.canonicalName, platform: game.platform });
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
  }

  return { matched, created, skipped, stopped };
}
