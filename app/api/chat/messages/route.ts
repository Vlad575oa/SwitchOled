import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function notifyMax(sessionId: string, content: string, name: string | null) {
  const token = process.env.MAX_BOT_TOKEN;
  const chatId = process.env.MAX_BOT_CHAT_ID;
  if (!token || !chatId) return;
  const text = `💬 Новое сообщение в чате\n👤 ${name ?? "Гость"}\n\n${content}`;
  try {
    await fetch(
      `https://botapi.max.ru/sendMessage?access_token=${token}&chat_id=${chatId}&text=${encodeURIComponent(text)}`,
      { method: "POST" }
    );
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
  if (!session.name?.trim()) {
    return NextResponse.json({ error: "name required before messaging" }, { status: 400 });
  }

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
