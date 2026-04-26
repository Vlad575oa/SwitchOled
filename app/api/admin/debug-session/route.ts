import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const session = await verifyAdminSession(token);

  return NextResponse.json({
    hasSecret: !!(process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET),
    secretSource: process.env.ADMIN_SESSION_SECRET ? "ADMIN_SESSION_SECRET" : process.env.NEXTAUTH_SECRET ? "NEXTAUTH_SECRET" : "none",
    hasDirectorPwd: !!process.env.ADMIN_DIRECTOR_PASSWORD,
    hasManagerPwd: !!process.env.ADMIN_MANAGER_PASSWORD,
    hasCookie: !!token,
    sessionValid: !!session,
    sessionRole: session?.r ?? null,
  });
}
