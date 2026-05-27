import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminSession, ADMIN_COOKIE } from "@/lib/adminSession";
import { cookies } from "next/headers";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const id = parseInt(params.id);
    const { name, hex } = await req.json();

    const color = await prisma.color.update({
      where: { id },
      data: { name, hex },
    });

    return NextResponse.json(color);
  } catch (err: any) {
    console.error("UPDATE COLOR ERROR:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const id = parseInt(params.id);
    await prisma.color.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE COLOR ERROR:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}
