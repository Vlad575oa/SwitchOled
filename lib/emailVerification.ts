import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}

export async function createEmailVerificationToken(email: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return rawToken;
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = getBaseUrl().replace(/\/+$/, "");
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "Подтвердите email для входа в аккаунт",
    text: `Подтвердите email: ${verifyUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2 style="margin:0 0 12px">Подтверждение email</h2>
        <p style="margin:0 0 16px">Спасибо за регистрацию. Чтобы активировать аккаунт, подтвердите email по кнопке ниже.</p>
        <p style="margin:0 0 20px">
          <a href="${verifyUrl}" style="background:#e11d48;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;display:inline-block;font-weight:700">
            Подтвердить email
          </a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#555">Если кнопка не работает, откройте ссылку:</p>
        <p style="margin:0;font-size:13px;word-break:break-all;color:#555">${verifyUrl}</p>
      </div>
    `,
  });
}

export async function verifyEmailToken(rawToken: string) {
  const token = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return { ok: false as const, reason: "not_found" };
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { ok: false as const, reason: "expired" };
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { email: record.identifier, emailVerified: null },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    }),
  ]);

  return { ok: true as const, email: record.identifier };
}
