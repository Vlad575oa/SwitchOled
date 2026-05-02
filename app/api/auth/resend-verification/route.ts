import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { buildRateLimitKey, rateLimit } from "@/lib/rateLimit";
import {
  createEmailVerificationToken,
  sendVerificationEmail,
} from "@/lib/emailVerification";

const ResendSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
});

export async function POST(request: Request) {
  try {
    const limit = rateLimit(buildRateLimitKey("auth-resend-verification", request), 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Слишком много попыток. Попробуйте позже." }, { status: 429 });
    }

    const parsed = ResendSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
    }

    const email = parsed.data.email;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    const token = await createEmailVerificationToken(email);
    await sendVerificationEmail(email, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[resend-verification]", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
