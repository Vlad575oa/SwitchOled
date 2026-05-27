import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminSession, ADMIN_COOKIE } from "@/lib/adminSession";
import { cookies } from "next/headers";

export async function PATCH(req: Request) {
  try {
    const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { updates } = await req.json();

    if (!Array.isArray(updates)) {
      return new NextResponse("Invalid updates", { status: 400 });
    }

    // Use a transaction for bulk updates
    await prisma.$transaction(
      updates.map((u: { id: number; price: number }) =>
        prisma.product.update({
          where: { id: u.id },
          data: { price: u.price },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("BULK PRICE UPDATE ERROR:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
