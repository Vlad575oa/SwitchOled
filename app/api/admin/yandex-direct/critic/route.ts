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
  if (!apiKey) return NextResponse.json({ error: "DEEPSEEK_API_KEY не настроен" }, { status: 503 });

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
          content: `Ты строгий критик рекламных поисковых запросов для магазина Nintendo Switch. Найди только явные нерелевантные запросы, которые стоит проверить и добавить в минус-слова. Не предлагай удалять запросы автоматически. Верни JSON: {"suggestions":[{"phrase":"...","reason":"...","risk":"high|medium","clicks":0,"cost":0}]}. Не добавляй брендовые и потенциально коммерческие запросы магазина в минус-слова без явного основания.`,
        },
        { role: "user", content: JSON.stringify(rows) },
      ],
    }),
  });
  if (!response.ok) return NextResponse.json({ error: `ИИ-критик: ${await response.text()}` }, { status: 502 });
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  return NextResponse.json(JSON.parse(content));
}
