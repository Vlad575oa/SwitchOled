import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { resolvePendingWithAi } from "@/lib/priceCompare/resolvePending";

// Батч-сопоставление ИИ (DeepSeek) для всех pending-строк конкретной загрузки прайса.
// Не связано с чат-ботом "Кира" — отдельный вызов DeepSeek с собственным промптом.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uploadId = Number(params.id);

  const pendingEntries = await prisma.priceEntry.findMany({
    where: { uploadId, matchStatus: "pending" },
    select: { id: true },
  });

  try {
    const result = await resolvePendingWithAi(pendingEntries.map((e) => e.id), request.signal);
    return NextResponse.json(result);
  } catch (e) {
    if (request.signal.aborted) {
      return NextResponse.json({ matched: 0, created: 0, skipped: 0, stopped: true });
    }
    console.error("resolve-pending error", e);
    return NextResponse.json({ error: "ИИ-сервис недоступен" }, { status: 503 });
  }
}
