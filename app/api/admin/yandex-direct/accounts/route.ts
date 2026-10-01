import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

async function authorized() {
  return verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
}

export async function GET() {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accounts = await prisma.yandexDirectAccount.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, login: true, displayName: true, createdAt: true } });
  return NextResponse.json({ accounts, selectedId: cookies().get("yandex_direct_account")?.value || null });
}

export async function POST(request: Request) {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const account = await prisma.yandexDirectAccount.findUnique({ where: { id }, select: { id: true } });
  if (!account) return NextResponse.json({ error: "Аккаунт не найден" }, { status: 404 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("yandex_direct_account", id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}

export async function DELETE(request: Request) {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  await prisma.yandexDirectAccount.delete({ where: { id } }).catch(() => null);
  const response = NextResponse.json({ ok: true });
  if (cookies().get("yandex_direct_account")?.value === id) response.cookies.delete("yandex_direct_account");
  return response;
}
