import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { visitorId, name, email } = await req.json();
  if (!visitorId) return NextResponse.json({ error: "visitorId required" }, { status: 400 });

  let session = await prisma.chatSession.findFirst({ where: { visitorId } });
  if (!session) {
    session = await prisma.chatSession.create({
      data: { visitorId, name: name ?? null, email: email ?? null },
    });
  } else if (name || email) {
    session = await prisma.chatSession.update({
      where: { id: session.id },
      data: { ...(name ? { name } : {}), ...(email ? { email } : {}) },
    });
  }
  return NextResponse.json({ sessionId: session.id });
}
