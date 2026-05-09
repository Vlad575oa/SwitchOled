import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function notifyMax(sessionId: string, content: string, name: string | null) {
  const webhookUrl = process.env.MAX_CHAT_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `💬 Новое сообщение в чате\n👤 ${name ?? "Гость"}\n\n${content}\n\nhttps://gameshop24.ru/admin/chat/${sessionId}`,
      }),
    });
  } catch {}
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const { sessionId, content } = await req.json();
  if (!sessionId || !content?.trim()) {
    return NextResponse.json({ error: "sessionId and content required" }, { status: 400 });
  }

  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const existingCount = await prisma.chatMessage.count({ where: { sessionId, sender: "USER" } });
  const isFirst = existingCount === 0;

  const message = await prisma.chatMessage.create({
    data: { sessionId, content: content.trim(), sender: "USER" },
  });

  await prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

  if (isFirst) {
    await notifyMax(sessionId, content.trim(), session.name);
  }

  return NextResponse.json(message);
}
