import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { SESSION_COOKIE, sessionIdsForToken } from "@/lib/auth";

export async function POST() {
  try {
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (token) {
      await prisma.session.deleteMany({ where: { id: { in: sessionIdsForToken(token) } } }).catch(() => {});
      cookies().delete(SESSION_COOKIE);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
