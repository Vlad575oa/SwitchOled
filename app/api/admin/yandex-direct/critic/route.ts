import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export async function POST(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, 300) : [];
  if (!rows.length) return NextResponse.json({ suggestions: [] });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    // Smart heuristic analysis when external LLM is not configured
    const suggestions: Array<{ phrase: string; reason: string; risk: "high" | "medium"; clicks: number; cost: number }> = [];
    const stopWords = [
      { word: "бесплатно", reason: "Некоммерческий интент («бесплатно»)", risk: "high" as const },
      { word: "скачать", reason: "Поиск файлов и пиратского контента, а не покупки консоли", risk: "high" as const },
      { word: "торрент", reason: "Запрос на скачивание с торрента", risk: "high" as const },
      { word: "своими руками", reason: "Самостоятельный моддинг без покупки услуг", risk: "high" as const },
      { word: "самостоятельно", reason: "Самостоятельная установка/прошивка", risk: "medium" as const },
      { word: "4pda", reason: "Форумный трафик, низкая конверсия в покупку", risk: "medium" as const },
      { word: "эмулятор", reason: "Поиск эмулятора на ПК/телефон, а не консоли", risk: "high" as const },
      { word: "yuzu", reason: "Поиск ПК-эмулятора", risk: "high" as const },
      { word: "ryujinx", reason: "Поиск ПК-эмулятора", risk: "high" as const },
      { word: "авито", reason: "Поиск объявлений на вторичном рынке", risk: "medium" as const },
      { word: "avito", reason: "Поиск объявлений на вторичном рынке", risk: "medium" as const },
      { word: "бу", reason: "Запрос на б/у технику", risk: "medium" as const },
      { word: "б/у", reason: "Запрос на б/у технику", risk: "medium" as const },
      { word: "ремонт", reason: "Сервисный ремонт/запчасти", risk: "medium" as const },
      { word: "запчасти", reason: "Поиск запчастей/деталей", risk: "high" as const },
    ];

    for (const row of rows) {
      const q = (row.Query || "").toLowerCase();
      if (!q) continue;

      let matched = false;
      for (const sw of stopWords) {
        if (q.includes(sw.word)) {
          suggestions.push({
            phrase: row.Query,
            reason: sw.reason,
            risk: sw.risk,
            clicks: row.Clicks || 0,
            cost: row.Cost || 0,
          });
          matched = true;
          break;
        }
      }

      if (!matched && row.Cost >= 300 && row.Conversions === 0 && row.Clicks >= 5) {
        suggestions.push({
          phrase: row.Query,
          reason: `Расход ${Math.round(row.Cost)} ₽ без единой конверсии при ${row.Clicks} кликах`,
          risk: row.Cost >= 800 ? "high" : "medium",
          clicks: row.Clicks || 0,
          cost: row.Cost || 0,
        });
      }
    }

    return NextResponse.json({
      suggestions: suggestions.sort((a, b) => b.cost - a.cost).slice(0, 50),
      mode: "heuristic",
    });
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `Ты строгий критик рекламных поисковых запросов для магазина консолей Nintendo Switch (игры, прошитые Switch, аксессуары). Найди явные нерелевантные запросы или слив бюджета, которые стоит добавить в минус-слова. Верни JSON: {"suggestions":[{"phrase":"...","reason":"...","risk":"high|medium","clicks":0,"cost":0}]}. Не добавляй целевые коммерческие запросы.`,
          },
          { role: "user", content: JSON.stringify(rows) },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    // Fallback if DeepSeek is unreachable
    return NextResponse.json({
      suggestions: rows
        .filter((r: any) => r.Cost >= 300 && r.Conversions === 0)
        .map((r: any) => ({
          phrase: r.Query,
          reason: `Расход ${Math.round(r.Cost)} ₽ без конверсий`,
          risk: "medium" as const,
          clicks: r.Clicks,
          cost: r.Cost,
        }))
        .slice(0, 30),
    });
  }
}
