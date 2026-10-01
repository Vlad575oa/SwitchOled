import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export async function GET(request: Request) {
  if (!await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value)) return NextResponse.redirect(new URL("/admin/login", request.url));
  const clientId = process.env.YANDEX_DIRECT_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/admin/yandex?yandexError=missing_client_id", request.url));
  const state = crypto.randomBytes(24).toString("hex");
  const redirectUri = `${new URL(request.url).origin}/api/admin/yandex-direct/oauth/callback`;
  const params = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri, scope: "direct:api", state, force_confirm: "yes" });
  const response = NextResponse.redirect(`https://oauth.yandex.ru/authorize?${params}`);
  response.cookies.set("yandex_direct_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return response;
}
