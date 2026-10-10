import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

import { encryptYandexSecret } from "@/lib/yandexDirectCrypto";
import { YANDEX_DIRECT_REDIRECT_URI } from "@/lib/yandexDirectOAuth";

async function authorized() {
  return verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
}

export async function GET() {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accounts = await prisma.yandexDirectAccount.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, login: true, displayName: true, createdAt: true, updatedAt: true },
  });
  const oauthConfigured = Boolean(
    (process.env.YANDEX_DIRECT_CLIENT_ID?.trim() || process.env.YANDEX_CLIENT_ID?.trim()) &&
    (process.env.YANDEX_DIRECT_CLIENT_SECRET?.trim() || process.env.YANDEX_CLIENT_SECRET?.trim())
  );
  return NextResponse.json({
    accounts,
    selectedId: cookies().get("yandex_direct_account")?.value || (accounts[0]?.id ?? null),
    oauthConfigured,
    redirectUri: YANDEX_DIRECT_REDIRECT_URI,
    mcpEndpoint: "https://mcp.directassist.pro/mcp",
  });
}

export async function POST(request: Request) {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  // Direct Token connection
  if (body.action === "add_token" || body.token) {
    const rawToken = typeof body.token === "string" ? body.token.trim() : "";
    if (!rawToken) {
      return NextResponse.json({ error: "Укажите OAuth токен Яндекс Директа" }, { status: 400 });
    }

    let yandexUserId = "";
    let login = (typeof body.login === "string" && body.login.trim()) || "";
    let displayName = (typeof body.displayName === "string" && body.displayName.trim()) || "";

    // 1. Try to fetch profile information from Yandex Login API
    try {
      const infoRes = await fetch("https://login.yandex.ru/info?format=json", {
        headers: { Authorization: `OAuth ${rawToken}` },
        cache: "no-store",
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        yandexUserId = String(info.id || info.login || "");
        login = login || info.login || "";
        displayName = displayName || info.real_name || info.display_name || login;
      }
    } catch (e) {
      // Passport endpoint might fail or be restricted, continue
    }

    // 2. Validate token against Yandex Direct API
    try {
      const directTestRes = await fetch("https://api.direct.yandex.com/json/v501/campaigns", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${rawToken}`,
          "Accept-Language": "ru",
          "Content-Type": "application/json; charset=utf-8",
          ...(login ? { "Client-Login": login } : {}),
        },
        body: JSON.stringify({
          method: "get",
          params: {
            SelectionCriteria: {},
            FieldNames: ["Id", "Name"],
            Page: { Limit: 1 },
          },
        }),
        cache: "no-store",
      });
      const directTestData = await directTestRes.json().catch(() => ({}));
      if (directTestData.error) {
        const errorDetail = directTestData.error.error_detail || directTestData.error.error_string || "Ошибка авторизации";
        return NextResponse.json({
          error: `Яндекс Директ вернул ошибку: ${errorDetail}`,
        }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({
        error: "Не удалось соединиться с API Яндекс Директа. Проверьте интернет-соединение.",
      }, { status: 502 });
    }

    if (!login) login = "direct-user";
    if (!yandexUserId) yandexUserId = `account-${login}-${Date.now()}`;

    const account = await prisma.yandexDirectAccount.upsert({
      where: { yandexUserId },
      update: {
        login,
        displayName: displayName || login,
        accessToken: encryptYandexSecret(rawToken),
        updatedAt: new Date(),
      },
      create: {
        yandexUserId,
        login,
        displayName: displayName || login,
        accessToken: encryptYandexSecret(rawToken),
      },
      select: { id: true, login: true, displayName: true },
    });

    const response = NextResponse.json({ ok: true, account });
    response.cookies.set("yandex_direct_account", account.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return response;
  }

  // Switch selected account
  const id = typeof body.id === "string" ? body.id : "";
  const account = await prisma.yandexDirectAccount.findUnique({ where: { id }, select: { id: true } });
  if (!account) return NextResponse.json({ error: "Аккаунт не найден" }, { status: 404 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("yandex_direct_account", id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}

export async function DELETE(request: Request) {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  await prisma.yandexDirectAccount.delete({ where: { id } }).catch(() => null);
  const response = NextResponse.json({ ok: true });
  if (cookies().get("yandex_direct_account")?.value === id) {
    response.cookies.delete("yandex_direct_account");
  }
  return response;
}
