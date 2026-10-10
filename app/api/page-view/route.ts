import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const Schema = z.object({
  pageType: z.enum(["home", "product", "article"]),
  path: z.string().trim().min(1).max(500),
  productId: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = Schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
    await prisma.pageView.create({ data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
