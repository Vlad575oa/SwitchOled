import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { resolvePendingWithAi } from "@/lib/priceCompare/resolvePending";

// Батч-сопоставление ИИ для выборочного набора pending-строк — менеджер
// отмечает галочками только нужные позиции на странице сравнения цен.
export async function POST(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const entryIds = Array.isArray(body.entryIds) ? body.entryIds.map(Number).filter(Number.isFinite) : [];

  if (entryIds.length === 0) {
    return NextResponse.json({ error: "Не выбрано ни одной позиции" }, { status: 400 });
  }

  try {
    const result = await resolvePendingWithAi(entryIds, request.signal);
    return NextResponse.json(result);
  } catch (e) {
    if (request.signal.aborted) {
      return NextResponse.json({ matched: 0, created: 0, skipped: 0, stopped: true });
    }
    console.error("price-entries resolve-pending error", e);
    return NextResponse.json({ error: "ИИ-сервис недоступен" }, { status: 503 });
  }
}
