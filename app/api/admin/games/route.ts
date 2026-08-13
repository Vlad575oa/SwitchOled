import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

const DEFAULT_PAGE_SIZE = 50;

export async function GET(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const platform = searchParams.get("platform");
  const supplierCountParam = searchParams.get("supplierCount");
  const supplierCount = supplierCountParam ? Number(supplierCountParam) : null;
  const pageSize = Math.min(500, Math.max(1, Number(searchParams.get("limit")) || DEFAULT_PAGE_SIZE));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const conditions: Prisma.Sql[] = [];
  if (platform) conditions.push(Prisma.sql`g.platform = ${platform}`);
  if (search) conditions.push(Prisma.sql`g."canonicalName" ILIKE ${`%${search}%`}`);
  const whereSql = conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;
  const havingSql =
    supplierCount != null && Number.isFinite(supplierCount)
      ? Prisma.sql`HAVING COUNT(DISTINCT pu."supplierId") = ${supplierCount}`
      : Prisma.empty;

  // Считаем по каждой игре: сколько разных алиасов, строк цен и, главное,
  // сколько РАЗНЫХ поставщиков её предлагают (не строк — один поставщик может
  // иметь несколько строк на игру из-за разных изданий/регионов).
  const rows = await prisma.$queryRaw<
    Array<{
      id: number;
      canonicalName: string;
      platform: string;
      region: string | null;
      aliasCount: bigint;
      entryCount: bigint;
      supplierCount: bigint;
    }>
  >`
    SELECT g.id, g."canonicalName", g.platform, g.region,
      COUNT(DISTINCT ga.id) AS "aliasCount",
      COUNT(DISTINCT pe.id) AS "entryCount",
      COUNT(DISTINCT pu."supplierId") AS "supplierCount"
    FROM "Game" g
    LEFT JOIN "GameAlias" ga ON ga."gameId" = g.id
    LEFT JOIN "PriceEntry" pe ON pe."gameId" = g.id
    LEFT JOIN "PriceUpload" pu ON pu.id = pe."uploadId"
    ${whereSql}
    GROUP BY g.id
    ${havingSql}
    ORDER BY "supplierCount" DESC, g."canonicalName" ASC
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
  `;

  const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count FROM (
      SELECT g.id
      FROM "Game" g
      LEFT JOIN "PriceEntry" pe ON pe."gameId" = g.id
      LEFT JOIN "PriceUpload" pu ON pu.id = pe."uploadId"
      ${whereSql}
      GROUP BY g.id
      ${havingSql}
    ) sub
  `;

  const games = rows.map((r) => ({
    id: r.id,
    canonicalName: r.canonicalName,
    platform: r.platform,
    region: r.region,
    _count: { aliases: Number(r.aliasCount), entries: Number(r.entryCount) },
    supplierCount: Number(r.supplierCount),
  }));

  return NextResponse.json({ games, total: Number(totalRows[0]?.count ?? 0), page, pageSize });
}
