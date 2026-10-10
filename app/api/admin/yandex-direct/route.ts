import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { getDirectCampaigns, getDirectSearchQueryReport, isDirectConfigured } from "@/lib/yandexDirect";

export async function GET(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const selectedAccountId = cookies().get("yandex_direct_account")?.value;
  if (!selectedAccountId && !(await isDirectConfigured())) {
    return NextResponse.json({ configured: false, campaigns: [], rows: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateTo = searchParams.get("dateTo") || new Date().toISOString().slice(0, 10);
    const dateFrom = searchParams.get("dateFrom") || new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const campaignIds = (searchParams.get("campaignIds") || "")
      .split(",").map(Number).filter((id) => Number.isFinite(id) && id > 0);
    const accountId = selectedAccountId;

    let campaigns = [];
    try {
      campaigns = await getDirectCampaigns(accountId);
    } catch (e) {
      // If campaigns fails due to authorization, propagate error
      throw e;
    }

    let rows: any[] = [];
    let reportWarning: string | null = null;
    try {
      rows = await getDirectSearchQueryReport({ dateFrom, dateTo, campaignIds, accountId });
    } catch (err) {
      reportWarning = err instanceof Error ? err.message : "Не удалось загрузить отчет по запросам";
    }

    return NextResponse.json({
      configured: true,
      campaigns,
      rows,
      reportWarning,
      dateFrom,
      dateTo,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка Яндекс Директа" }, { status: 502 });
  }
}
