const DIRECT_API_URL = "https://api.direct.yandex.com/json/v501";
import prisma from "@/lib/prisma";
import { decryptYandexSecret } from "@/lib/yandexDirectCrypto";

export type DirectCampaign = {
  Id: number;
  Name: string;
  State?: string;
  Status?: string;
  Type?: string;
};

export type DirectQueryRow = {
  CampaignId: number;
  CampaignName: string;
  AdGroupName: string;
  Query: string;
  Keyword?: string;
  Impressions: number;
  Clicks: number;
  Cost: number;
  Conversions: number;
  CostPerConversion: number;
};

async function getDirectConfig(accountId?: string) {
  const account = accountId ? await prisma.yandexDirectAccount.findUnique({ where: { id: accountId } }) : null;
  const token = account ? decryptYandexSecret(account.accessToken) : process.env.YANDEX_DIRECT_OAUTH_TOKEN?.trim();
  if (!token) throw new Error("YANDEX_DIRECT_OAUTH_TOKEN не настроен");
  return {
    token,
    clientLogin: account?.login || process.env.YANDEX_DIRECT_CLIENT_LOGIN?.trim(),
  };
}

async function directRequest(service: string, body: Record<string, unknown>, accountId?: string) {
  const config = await getDirectConfig(accountId);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    "Accept-Language": "ru",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (config.clientLogin) headers["Client-Login"] = config.clientLogin;

  const response = await fetch(`${DIRECT_API_URL}/${service}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Яндекс Директ: ${text.slice(0, 600)}`);
  return text;
}

export async function getDirectCampaigns(accountId?: string) {
  const raw = await directRequest("campaigns", {
    method: "get",
    params: {
      SelectionCriteria: {},
      FieldNames: ["Id", "Name", "State", "Status", "Type"],
    },
  }, accountId);
  const data = JSON.parse(raw) as { result?: { Campaigns?: DirectCampaign[] }; error?: { error_detail?: string } };
  if (data.error) throw new Error(data.error.error_detail || "Не удалось получить кампании");
  return data.result?.Campaigns ?? [];
}

function parseNumber(value: string | undefined) {
  const normalized = (value ?? "0").replace(/\s/g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function parseTsv(raw: string): DirectQueryRow[] {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split("\t");
  return lines.slice(1).map((line) => {
    const values = line.split("\t");
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    return {
      CampaignId: Number(row.CampaignId) || 0,
      CampaignName: row.CampaignName || "",
      AdGroupName: row.AdGroupName || "",
      Query: row.Query || row.Keyword || "",
      Keyword: row.Keyword || undefined,
      Impressions: parseNumber(row.Impressions),
      Clicks: parseNumber(row.Clicks),
      Cost: parseNumber(row.Cost),
      Conversions: parseNumber(row.Conversions),
      CostPerConversion: parseNumber(row.CostPerConversion),
    };
  });
}

export async function getDirectSearchQueryReport(input: {
  dateFrom: string;
  dateTo: string;
  campaignIds?: number[];
  accountId?: string;
}) {
  const filters = input.campaignIds?.length
    ? [{ Field: "CampaignId", Operator: "IN", Values: input.campaignIds.map(String) }]
    : [];
  const raw = await directRequest("reports", {
    params: {
      SelectionCriteria: { Filter: filters },
      FieldNames: [
        "Date",
        "CampaignId",
        "CampaignName",
        "AdGroupName",
        "Query",
        "Keyword",
        "Impressions",
        "Clicks",
        "Cost",
        "Conversions",
        "CostPerConversion",
      ],
      ReportName: `GameShop24 search queries ${input.dateFrom} ${input.dateTo}`,
      ReportType: "SEARCH_QUERY_PERFORMANCE_REPORT",
      DateRangeType: "CUSTOM_DATE",
      DateFrom: input.dateFrom,
      DateTo: input.dateTo,
      Format: "TSV",
      IncludeVAT: "NO",
      IncludeDiscount: "NO",
    },
  }, input.accountId);
  return parseTsv(raw);
}

export function isDirectConfigured() {
  return Boolean(process.env.YANDEX_DIRECT_OAUTH_TOKEN?.trim());
}
