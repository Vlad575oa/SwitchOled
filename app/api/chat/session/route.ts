import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { visitorId, name, email } = await req.json();
  if (!visitorId) return NextResponse.json({ error: "visitorId required" }, { status: 400 });

  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim() : "";

  let session = await prisma.chatSession.findFirst({ where: { visitorId } });
  if (!session) {
    if (!normalizedName) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    session = await prisma.chatSession.create({
      data: {
        visitorId,
        name: normalizedName,
        email: normalizedEmail || null,
      },
    });
  } else if (normalizedName || normalizedEmail) {
    session = await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        ...(normalizedName ? { name: normalizedName } : {}),
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
      },
    });
  }
  return NextResponse.json({ sessionId: session.id });
}
