// ВАЖНО: этот модуль не связан с чат-ботом "Кира" (app/api/ai-chat/route.ts).
// Он используется только для сопоставления строк прайс-листов со справочником игр
// (страница /admin/price-compare) и не должен на неё влиять.

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
export const AI_MATCH_BATCH_SIZE = 40;

export type PendingRow = {
  entryId: number;
  rawName: string;
  normalizedName: string;
  platform: string | null;
};

export type ExistingGame = {
  id: number;
  canonicalName: string;
  platform: string;
};

export type AiMatchDecision =
  | { entryId: number; action: "match"; gameId: number }
  | { entryId: number; action: "new"; canonicalName: string; platform: string }
  | { entryId: number; action: "skip" };

export function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

function buildPrompt(rows: PendingRow[], games: ExistingGame[]): string {
  const gamesList = games.map((g) => `${g.id}: ${g.canonicalName} (${g.platform})`).join("\n");
  const rowsList = rows
    .map((r) => `${r.entryId}: "${r.rawName}" [платформа: ${r.platform ?? "неизвестна"}]`)
    .join("\n");

  return `Ты сопоставляешь строки из прайс-листов магазина видеоигр с каноническим справочником игр.

СПРАВОЧНИК ИГР (id: название (платформа)):
${gamesList || "(пусто)"}

СТРОКИ ДЛЯ СОПОСТАВЛЕНИЯ (entryId: "название" [платформа]):
${rowsList}

Правила:
1. Если строка — это та же игра, что уже есть в справочнике (опечатки, сокращения, разный регистр, доп. слова вроде "Deluxe Edition"/"Complete" не считаются другой игрой, если это то же базовое издание) — верни action "match" с gameId из справочника.
2. Если это игра, которой точно нет в справочнике — верни action "new" с canonicalName (чистое каноническое название без региональных пометок и кодов) и platform (одно из: PS4, PS5, SWITCH, PSP, XBOX).
3. Если строка — это не игра (акция, заголовок, мусор) или платформу определить невозможно — верни action "skip".
4. Не путай игры с похожими, но разными номерами частей серии (например "GTA 5" и "GTA 6" — разные игры).

Верни строго JSON без пояснений в формате:
{"decisions": [{"entryId": number, "action": "match"|"new"|"skip", "gameId"?: number, "canonicalName"?: string, "platform"?: string}]}`;
}

/**
 * Одна DeepSeek-транзакция на один батч строк. Вынесена отдельно от общего цикла,
 * чтобы вызывающий код мог применять результат к БД и проверять сигнал остановки
 * между батчами — а не только по завершении всей очереди.
 */
export async function aiMatchOneBatch(
  rows: PendingRow[],
  games: ExistingGame[],
  signal?: AbortSignal
): Promise<AiMatchDecision[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY не настроен");
  if (rows.length === 0) return [];

  const relevantGames = games.filter((g) => !rows[0]?.platform || rows.some((r) => r.platform === g.platform || !r.platform));

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: buildPrompt(rows, relevantGames) }],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 4096,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("aiMatchOneBatch: DeepSeek error", err);
    return rows.map((r) => ({ entryId: r.entryId, action: "skip" }));
  }

  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(raw) as { decisions: AiMatchDecision[] };
    return parsed.decisions ?? [];
  } catch {
    console.error("aiMatchOneBatch: failed to parse DeepSeek response", raw);
    return rows.map((r) => ({ entryId: r.entryId, action: "skip" }));
  }
}
