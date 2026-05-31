import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const count = await prisma.order.count({
      where: {
        status: "pending",
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("ORDER COUNT API ERROR:", error);
    return NextResponse.json({ count: 0 });
  }
}
