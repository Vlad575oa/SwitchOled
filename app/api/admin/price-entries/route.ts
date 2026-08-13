import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

// Список строк, требующих ручного подтверждения сопоставления с игрой.
export async function GET(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get("uploadId");

  const entries = await prisma.priceEntry.findMany({
    where: {
      matchStatus: "pending",
      ...(uploadId ? { uploadId: Number(uploadId) } : {}),
    },
    include: { upload: { include: { supplier: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const games = await prisma.game.findMany({
    orderBy: { canonicalName: "asc" },
    select: { id: true, canonicalName: true, platform: true },
  });

  return NextResponse.json({ entries, games });
}
