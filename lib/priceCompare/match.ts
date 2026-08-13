import prisma from "@/lib/prisma";
import type { ParsedRow } from "./types";

const FUZZY_THRESHOLD = 0.85;

/** Простая мера схожести строк (коэффициент Дайса по биграммам), без внешних зависимостей. */
function bigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigrams = (s: string) => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      map.set(bg, (map.get(bg) ?? 0) + 1);
    }
    return map;
  };

  const mapA = bigrams(a);
  const mapB = bigrams(b);
  let intersection = 0;
  Array.from(mapA.entries()).forEach(([bg, countA]) => {
    const countB = mapB.get(bg);
    if (countB) intersection += Math.min(countA, countB);
  });

  const totalA = Array.from(mapA.values()).reduce((s, v) => s + v, 0);
  const totalB = Array.from(mapB.values()).reduce((s, v) => s + v, 0);
  return (2 * intersection) / (totalA + totalB);
}

export type MatchResult = {
  gameId: number | null;
  matchStatus: "auto" | "pending";
  matchScore: number | null;
};

/**
 * Пытается сопоставить строку прайса с существующим справочником игр:
 * 1) точное совпадение по GameAlias.normalized
 * 2) нечёткое совпадение (биграммы) среди алиасов той же платформы
 * Если ничего не подошло — строка уходит в очередь на подтверждение (pending).
 */
export async function matchRow(row: ParsedRow): Promise<MatchResult> {
  const exact = await prisma.gameAlias.findUnique({
    where: { normalized: row.normalizedName },
    select: { gameId: true },
  });
  if (exact) return { gameId: exact.gameId, matchStatus: "auto", matchScore: 1 };

  const candidates = await prisma.gameAlias.findMany({
    where: row.platform ? { game: { platform: row.platform } } : undefined,
    select: { normalized: true, gameId: true },
    take: 5000,
  });

  let best: { gameId: number; score: number } | null = null;
  for (const candidate of candidates) {
    const score = bigramSimilarity(row.normalizedName, candidate.normalized);
    if (score >= FUZZY_THRESHOLD && (!best || score > best.score)) {
      best = { gameId: candidate.gameId, score };
    }
  }

  if (best) return { gameId: best.gameId, matchStatus: "auto", matchScore: best.score };
  return { gameId: null, matchStatus: "pending", matchScore: null };
}
