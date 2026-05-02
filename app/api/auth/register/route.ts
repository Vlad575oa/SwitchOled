import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import {
  hashPassword,
} from "@/lib/auth";
import { buildRateLimitKey, rateLimit } from "@/lib/rateLimit";
import {
  createEmailVerificationToken,
  sendVerificationEmail,
} from "@/lib/emailVerification";

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(8).max(128),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Необходимо согласие на обработку персональных данных" }),
  }),
});

export async function POST(request: Request) {
  try {
    const limit = rateLimit(buildRateLimitKey("auth-register", request), 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Слишком много попыток. Попробуйте позже." }, { status: 429 });
    }
    const parsed = RegisterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Некорректные данные" }, { status: 400 });
    }
    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check uniqueness
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      if (existing.emailVerified) {
        return NextResponse.json(
          { error: "Пользователь с таким email уже существует" },
          { status: 409 }
        );
      }

      const token = await createEmailVerificationToken(normalizedEmail);
      await sendVerificationEmail(normalizedEmail, token);
      return NextResponse.json({
        success: true,
        message: "Письмо с подтверждением отправлено повторно",
      });
    }

    const { hash, salt } = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email: normalizedEmail,
        passwordHash: hash,
        passwordSalt: salt,
      },
    });

    const token = await createEmailVerificationToken(normalizedEmail);
    await sendVerificationEmail(normalizedEmail, token);

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      message: "Регистрация завершена. Проверьте почту для подтверждения email.",
    });
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
