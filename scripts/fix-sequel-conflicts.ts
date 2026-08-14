import prisma from "../lib/prisma";
import { normalizeName } from "../lib/priceCompare/normalize";

const ROMAN_TO_ARABIC: [string, string][] = [
  ["xviii", "18"], ["xvii", "17"], ["xvi", "16"], ["xiv", "14"], ["xv", "15"],
  ["xiii", "13"], ["xii", "12"], ["xi", "11"], ["xix", "19"], ["xx", "20"],
  ["viii", "8"], ["vii", "7"], ["vi", "6"], ["iv", "4"], ["ix", "9"],
  ["iii", "3"], ["ii", "2"], ["v", "5"], ["x", "10"], ["i", "1"],
];

function romanToArabicText(text: string): string {
  let result = text;
  for (const [roman, arabic] of ROMAN_TO_ARABIC) {
    result = result.replace(new RegExp(`\\b${roman}\\b`, "gi"), arabic);
  }
  return result;
}

function sequelNumbers(text: string): string[] {
  return romanToArabicText(text).match(/\b\d{1,3}\b/g) ?? [];
}

function bigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) { const bg = s.slice(i, i + 2); m.set(bg, (m.get(bg) ?? 0) + 1); }
    return m;
  };
  const mapA = bigrams(a), mapB = bigrams(b);
  let inter = 0;
  Array.from(mapA.entries()).forEach(([bg, cA]) => { const cB = mapB.get(bg); if (cB) inter += Math.min(cA, cB); });
  const totalA = Array.from(mapA.values()).reduce((s, v) => s + v, 0);
  const totalB = Array.from(mapB.values()).reduce((s, v) => s + v, 0);
  return (2 * inter) / (totalA + totalB);
}

function hasConflict(a: string, b: string): boolean {
  const numsA = sequelNumbers(a);
  const numsB = sequelNumbers(b);
  if (numsA.length === 0 || numsB.length === 0) return false;
  const setB = new Set(numsB);
  return !numsA.some((n) => setB.has(n));
}

const APPLY = process.argv.includes("--apply");

async function main() {
  const entries = await prisma.priceEntry.findMany({
    where: { gameId: { not: null } },
    select: { id: true, rawName: true, normalizedName: true, gameId: true, game: { select: { canonicalName: true, platform: true } } },
  });

  const allGamesByPlatform = new Map<string, { id: number; canonicalName: string; normalized: string }[]>();
  const allGames = await prisma.game.findMany({ select: { id: true, canonicalName: true, platform: true } });
  for (const g of allGames) {
    const list = allGamesByPlatform.get(g.platform) ?? [];
    list.push({ id: g.id, canonicalName: g.canonicalName, normalized: normalizeName(g.canonicalName) });
    allGamesByPlatform.set(g.platform, list);
  }

  let fixed = 0, unresolved = 0, falsePositive = 0;

  for (const e of entries) {
    if (!e.game) continue;
    const gameNormalized = normalizeName(e.game.canonicalName);
    if (!hasConflict(e.normalizedName, gameNormalized)) continue;

    const candidates = allGamesByPlatform.get(e.game.platform) ?? [];
    const rowNums = new Set(sequelNumbers(e.normalizedName));
    const goodCandidates = candidates.filter((c) => {
      const cNums = sequelNumbers(c.normalized);
      return cNums.length > 0 && cNums.some((n) => rowNums.has(n));
    });

    let best: { id: number; name: string; score: number } | null = null;
    for (const c of goodCandidates) {
      const score = bigramSimilarity(e.normalizedName, c.normalized);
      if (!best || score > best.score) best = { id: c.id, name: c.canonicalName, score };
    }

    if (!best || best.score < 0.7 || best.id === e.gameId) {
      unresolved++;
      console.log(`UNRESOLVED #${e.id} "${e.rawName}" -> currently "${e.game.canonicalName}" (${e.game.platform}) — best candidate: ${best ? `${best.name} (${best.score.toFixed(2)})` : "none"}`);
      continue;
    }

    fixed++;
    console.log(`FIX #${e.id} "${e.rawName}": "${e.game.canonicalName}" (${e.gameId}) -> "${best.name}" (${best.id}) [score ${best.score.toFixed(2)}]`);

    if (APPLY) {
      await prisma.priceEntry.update({ where: { id: e.id }, data: { gameId: best.id, matchStatus: "confirmed" } });
      await prisma.gameAlias.upsert({
        where: { normalized_platform: { normalized: e.normalizedName, platform: e.game.platform } },
        update: { gameId: best.id },
        create: { gameId: best.id, rawText: e.rawName, normalized: e.normalizedName, platform: e.game.platform, source: "manual" },
      });
    }
  }

  console.log(`\n${APPLY ? "APPLIED" : "DRY RUN"}: fixed=${fixed} unresolved=${unresolved}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
