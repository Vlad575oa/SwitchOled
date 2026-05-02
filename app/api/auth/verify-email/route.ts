import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailToken } from "@/lib/emailVerification";

const VerifySchema = z.object({
  token: z.string().min(20).max(200),
});

export async function POST(request: Request) {
  try {
    const parsed = VerifySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректный токен" }, { status: 400 });
    }

    const result = await verifyEmailToken(parsed.data.token);
    if (!result.ok) {
      if (result.reason === "expired") {
        return NextResponse.json({ error: "Ссылка подтверждения устарела" }, { status: 410 });
      }
      return NextResponse.json({ error: "Ссылка подтверждения недействительна" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[verify-email]", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
