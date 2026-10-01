import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { getDirectCampaigns, getDirectSearchQueryReport, isDirectConfigured } from "@/lib/yandexDirect";

export async function GET(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const selectedAccountId = cookies().get("yandex_direct_account")?.value;
  if (!selectedAccountId && !isDirectConfigured()) {
    return NextResponse.json({ configured: false, campaigns: [], rows: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateTo = searchParams.get("dateTo") || new Date().toISOString().slice(0, 10);
    const dateFrom = searchParams.get("dateFrom") || new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const campaignIds = (searchParams.get("campaignIds") || "")
      .split(",").map(Number).filter((id) => Number.isFinite(id) && id > 0);
    const accountId = selectedAccountId;
    const [campaigns, rows] = await Promise.all([
      getDirectCampaigns(accountId),
      getDirectSearchQueryReport({ dateFrom, dateTo, campaignIds, accountId }),
    ]);
    return NextResponse.json({ configured: true, campaigns, rows, dateFrom, dateTo });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка Яндекс Директа" }, { status: 502 });
  }
}
