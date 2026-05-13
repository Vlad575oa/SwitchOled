import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await prisma.pageContent.findMany();
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.id] = row.data;
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json() as Record<string, unknown>;
    await Promise.all(
      Object.entries(body).map(([section, data]) =>
        prisma.pageContent.upsert({
          where: { id: section },
          create: { id: section, data: data as any },
          update: { data: data as any },
        })
      )
    );
    revalidatePath("/", "layout");
    revalidatePath("/contacts");
    revalidatePath("/delivery");
    revalidatePath("/about");
    revalidatePath("/warranty");
    revalidatePath("/catalog/all");
    revalidatePath("/catalog");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
