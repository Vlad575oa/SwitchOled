import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

async function resolveUserId() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: token },
    select: { userId: true, expires: true },
  });

  if (!session || session.expires < new Date()) return null;
  return session.userId;
}

export async function GET() {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ ids: [] }, { status: 401 });

    const rows = await prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ids: rows.map((r) => r.productId) });
  } catch {
    return NextResponse.json({ ids: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const idsRaw = Array.isArray(body.ids) ? body.ids : [];
    const singleId = Number(body.productId);
    const ids = Array.from(
      new Set(
        [...idsRaw, singleId]
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n > 0)
      )
    );

    if (!ids.length) return NextResponse.json({ success: true });

    await prisma.$transaction(
      ids.map((productId) =>
        prisma.wishlistItem.upsert({
          where: { userId_productId: { userId, productId } },
          create: { userId, productId },
          update: {},
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    if (body.all === true) {
      await prisma.wishlistItem.deleteMany({ where: { userId } });
      return NextResponse.json({ success: true });
    }

    const productId = Number(body.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    await prisma.wishlistItem.deleteMany({
      where: { userId, productId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

