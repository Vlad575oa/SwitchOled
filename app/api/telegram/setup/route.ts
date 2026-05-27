import { NextResponse } from "next/server";

// GET /api/telegram/setup — register webhook with Telegram
// Call once after deploy: https://gameshop24.ru/api/telegram/setup
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 503 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://gameshop24.ru";
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true }),
    }
  );

  const data = await res.json();
  return NextResponse.json({ webhook: webhookUrl, telegram: data });
}
