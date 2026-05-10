import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.chatSession.findMany({
    where: {
      AND: [
        { name: { not: null } },
        { name: { not: "" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { messages: { where: { sender: "USER", isRead: false } } },
      },
    },
  });

  return NextResponse.json(sessions.map((s) => ({
    id: s.id,
    visitorId: s.visitorId,
    name: s.name,
    email: s.email,
    isResolved: s.isResolved,
    updatedAt: s.updatedAt,
    lastMessage: s.messages[0] ?? null,
    unreadCount: s._count.messages,
  })));
}
