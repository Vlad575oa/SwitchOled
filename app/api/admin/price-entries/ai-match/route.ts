import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

const BATCH_SIZE = 25;
const CANDIDATES_PER_ROW = 8;

type Suggestion = {
  id: number;
  decision: "match" | "new" | "skip";
  gameId?: number;
  canonicalName?: string;
  confidence: number;
  reason?: string;
};

function extractKeywords(rawName: string): string {
  return rawName
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-zA-Zа-яА-ЯёЁ0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
}

// Подбирает короткий список кандидатов из каталога под конкретную строку прайса —
// весь каталог (тысячи игр) в промпт не влезает и не нужен, модели хватает
// нескольких похожих вариантов, чтобы решить: это опечатка существующей игры или новая.
async function findCandidates(rawName: string, platform: string | null) {
  const keywords = extractKeywords(rawName);
  if (!keywords) return [];
  return prisma.game.findMany({
    where: {
      canonicalName: { contains: keywords.split(" ")[0], mode: "insensitive" },
      ...(platform ? { platform } : {}),
    },
    select: { id: true, canonicalName: true, platform: true },
    take: CANDIDATES_PER_ROW,
  });
}

async function callDeepSeek(items: { id: number; rawName: string; platform: string | null; candidates: { id: number; canonicalName: string }[] }[]) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY не настроен");

  const systemPrompt = `Ты помогаешь сопоставить строки из прайс-листа поставщика игр с каталогом магазина.
Для каждой строки дан "rawName" (как он написан у поставщика, часто с опечатками/сокращениями/пометками региона) и короткий список кандидатов из каталога (могут быть нерелевантны).
Верни JSON вида {"results":[{"id":number,"decision":"match"|"new"|"skip","gameId"?:number,"canonicalName"?:string,"confidence":number}]}.
Правила:
- "match": строка — это игра из списка кандидатов (опечатка, сокращение, доп. пометки). Укажи gameId кандидата.
- "new": строка — это игра, которой точно нет среди кандидатов. Укажи canonicalName — очищенное каноничное название без региональных пометок/кодов изданий (CUSA/PPSA), без "(rus sub)" и т.п.
- "skip": строка вообще не игра (аксессуар, карта памяти, чехол, подписка, акционный/служебный текст) или название непонятно/бессмысленно как есть.
- confidence — от 0 до 1, насколько ты уверен.
Отвечай только JSON, без пояснений вне него.`;

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify({ items }) },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek error: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return (parsed.results ?? []) as Suggestion[];
}

export async function POST(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const entryIds: number[] | undefined = Array.isArray(body.entryIds) ? body.entryIds.map(Number) : undefined;

  const entries = await prisma.priceEntry.findMany({
    where: {
      matchStatus: "pending",
      ...(entryIds ? { id: { in: entryIds } } : {}),
    },
    select: { id: true, rawName: true, platform: true },
    take: 300,
  });

  if (entries.length === 0) return NextResponse.json({ suggestions: [] });

  const withCandidates = await Promise.all(
    entries.map(async (e) => ({
      id: e.id,
      rawName: e.rawName,
      platform: e.platform,
      candidates: (await findCandidates(e.rawName, e.platform)).map((c) => ({ id: c.id, canonicalName: c.canonicalName })),
    }))
  );

  const batches: (typeof withCandidates)[] = [];
  for (let i = 0; i < withCandidates.length; i += BATCH_SIZE) batches.push(withCandidates.slice(i, i + BATCH_SIZE));

  try {
    const batchResults = await Promise.all(batches.map((b) => callDeepSeek(b)));
    const suggestions = batchResults.flat();

    // Подсказка ни к чему не обязывает и ничего не пишет в базу сама — только
    // возвращает предложения, подтверждение всё равно делает человек через /confirm.
    const candidatesById = new Map(withCandidates.map((e) => [e.id, e.candidates]));
    const entryById = new Map(entries.map((e) => [e.id, e]));

    // Кандидатов на "match" мы ищем по первому слову СЫРОГО названия (может быть
    // сокращением вроде "GTA") — модель иногда расшифровывает сокращение и решает
    // "new", хотя игра под полным названием уже есть в каталоге, просто не попала
    // в узкий список кандидатов. Перепроверяем по названию, которое предложила сама модель.
    const enriched = await Promise.all(
      suggestions.map(async (s) => {
        if (s.decision === "match" && s.gameId) {
          const candidate = candidatesById.get(s.id)?.find((c) => c.id === s.gameId);
          return { ...s, matchedName: candidate?.canonicalName ?? null };
        }
        if (s.decision === "new" && s.canonicalName) {
          const entry = entryById.get(s.id);
          const existing = await prisma.game.findFirst({
            where: {
              canonicalName: { equals: s.canonicalName, mode: "insensitive" },
              ...(entry?.platform ? { platform: entry.platform } : {}),
            },
            select: { id: true, canonicalName: true },
          });
          if (existing) {
            return { ...s, decision: "match" as const, gameId: existing.id, matchedName: existing.canonicalName };
          }
        }
        return s;
      })
    );

    return NextResponse.json({ suggestions: enriched });
  } catch (error) {
    console.error("ai-match error", error);
    return NextResponse.json({ error: "Ошибка ИИ-разбора" }, { status: 502 });
  }
}
