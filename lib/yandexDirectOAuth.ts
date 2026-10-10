import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { encryptYandexSecret } from "@/lib/yandexDirectCrypto";

export const YANDEX_DIRECT_REDIRECT_URI =
  process.env.YANDEX_DIRECT_REDIRECT_URI?.trim() ||
  "https://gameshop24.ru/api/yandex-direct/oauth/callback";

export async function startYandexDirectOAuth(request: Request) {
  if (!await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const clientId = process.env.YANDEX_DIRECT_CLIENT_ID?.trim() || process.env.YANDEX_CLIENT_ID?.trim();
  if (!clientId) {
    return NextResponse.redirect(new URL("/admin/yandex?yandexError=missing_client_id", request.url));
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: YANDEX_DIRECT_REDIRECT_URI,
    scope: "direct:api",
    state,
    force_confirm: "yes",
  });
  const response = NextResponse.redirect(`https://oauth.yandex.ru/authorize?${params}`);
  response.cookies.set("yandex_direct_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return response;
}

export async function handleYandexDirectOAuthCallback(request: Request) {
  if (!await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  if (!state || state !== cookies().get("yandex_direct_oauth_state")?.value) {
    return NextResponse.redirect(new URL("/admin/yandex?yandexError=invalid_state", request.url));
  }

  const code = url.searchParams.get("code");
  const clientId = process.env.YANDEX_DIRECT_CLIENT_ID?.trim() || process.env.YANDEX_CLIENT_ID?.trim();
  const clientSecret = process.env.YANDEX_DIRECT_CLIENT_SECRET?.trim() || process.env.YANDEX_CLIENT_SECRET?.trim();
  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/admin/yandex?yandexError=oauth_config", request.url));
  }

  const tokenResponse = await fetch("https://oauth.yandex.ru/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: YANDEX_DIRECT_REDIRECT_URI,
    }),
  });
  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL("/admin/yandex?yandexError=token_exchange", request.url));
  }

  const token = await tokenResponse.json();
  const infoResponse = await fetch("https://login.yandex.ru/info?format=json", {
    headers: { Authorization: `OAuth ${token.access_token}` },
  });
  const info = infoResponse.ok ? await infoResponse.json() : {};
  const yandexUserId = String(info.id || info.login || `account-${Date.now()}`);
  const login = info.login || "Yandex account";
  const displayName = info.real_name || info.display_name || login;
  const expiresAt = token.expires_in
    ? new Date(Date.now() + Number(token.expires_in) * 1000)
    : null;

  const account = await prisma.yandexDirectAccount.upsert({
    where: { yandexUserId },
    update: {
      login,
      displayName,
      accessToken: encryptYandexSecret(token.access_token),
      refreshToken: token.refresh_token ? encryptYandexSecret(token.refresh_token) : null,
      expiresAt,
    },
    create: {
      yandexUserId,
      login,
      displayName,
      accessToken: encryptYandexSecret(token.access_token),
      refreshToken: token.refresh_token ? encryptYandexSecret(token.refresh_token) : null,
      expiresAt,
    },
    select: { id: true },
  });

  const response = NextResponse.redirect(new URL("/admin/yandex?yandexConnected=1", request.url));
  response.cookies.set("yandex_direct_account", account.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  response.cookies.delete("yandex_direct_oauth_state");
  return response;
}
