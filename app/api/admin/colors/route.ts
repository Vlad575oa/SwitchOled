import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminSession, ADMIN_COOKIE } from "@/lib/adminSession";
import { cookies } from "next/headers";

export async function GET() {
  const colors = await prisma.color.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(colors);
}

export async function POST(req: Request) {
  try {
    const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { name, hex } = await req.json();
    if (!name || !hex) return new NextResponse("Name and hex required", { status: 400 });

    const color = await prisma.color.create({
      data: { name, hex },
    });

    return NextResponse.json(color);
  } catch (err: any) {
    console.error("CREATE COLOR ERROR:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}
