import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productId = Number(body.productId);
    const source: string = body.source ?? "unknown";

    if (!productId || isNaN(productId)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    await prisma.cartEvent.create({ data: { productId, source } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
