import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  // Mark user messages as read
  await prisma.chatMessage.updateMany({
    where: { sessionId, sender: "USER", isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, content } = await req.json();
  if (!sessionId || !content?.trim()) {
    return NextResponse.json({ error: "sessionId and content required" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: { sessionId, content: content.trim(), sender: "ADMIN", isRead: true },
  });

  await prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

  return NextResponse.json(message);
}
