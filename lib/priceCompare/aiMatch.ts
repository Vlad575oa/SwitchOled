// ВАЖНО: этот модуль не связан с чат-ботом "Кира" (app/api/ai-chat/route.ts).
// Он используется только для сопоставления строк прайс-листов со справочником игр
// (страница /admin/price-compare) и не должен на неё влиять.

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const BATCH_SIZE = 40;

type PendingRow = {
  entryId: number;
  rawName: string;
  normalizedName: string;
  platform: string | null;
};

type ExistingGame = {
  id: number;
  canonicalName: string;
  platform: string;
};

export type AiMatchDecision =
  | { entryId: number; action: "match"; gameId: number }
  | { entryId: number; action: "new"; canonicalName: string; platform: string }
  | { entryId: number; action: "skip" };

function chunk<T>(items: T[], size: number): T[][] {
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
 * Батч-сопоставление pending-строк прайса со справочником игр через DeepSeek.
 * Используется только менеджером в очереди подтверждения на /admin/price-compare —
 * не вызывается автоматически при каждой загрузке файла.
 */
export async function aiMatchBatch(rows: PendingRow[], games: ExistingGame[]): Promise<AiMatchDecision[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY не настроен");
  if (rows.length === 0) return [];

  const batches = chunk(rows, BATCH_SIZE);
  const allDecisions: AiMatchDecision[] = [];

  for (const batch of batches) {
    const relevantGames = games.filter((g) => !batch[0]?.platform || batch.some((r) => r.platform === g.platform || !r.platform));

    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: buildPrompt(batch, relevantGames) }],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("aiMatchBatch: DeepSeek error", err);
      batch.forEach((r) => allDecisions.push({ entryId: r.entryId, action: "skip" }));
      continue;
    }

    const data = await res.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "{}";

    try {
      const parsed = JSON.parse(raw) as { decisions: AiMatchDecision[] };
      allDecisions.push(...(parsed.decisions ?? []));
    } catch (e) {
      console.error("aiMatchBatch: failed to parse DeepSeek response", raw);
      batch.forEach((r) => allDecisions.push({ entryId: r.entryId, action: "skip" }));
    }
  }

  return allDecisions;
}
