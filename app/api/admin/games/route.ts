import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export async function GET(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const platform = searchParams.get("platform");

  const games = await prisma.game.findMany({
    where: {
      ...(platform ? { platform } : {}),
      ...(search ? { canonicalName: { contains: search, mode: "insensitive" } } : {}),
    },
    include: {
      _count: { select: { aliases: true, entries: true } },
    },
    orderBy: { canonicalName: "asc" },
    take: 500,
  });

  return NextResponse.json({ games });
}
