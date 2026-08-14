import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

const PAGE_SIZE = 50;

// Берём для каждого поставщика только последнюю (по дате) успешную загрузку,
// чтобы не смешивать устаревшие и свежие прайсы в одном сравнении.
async function latestUploadIdsPerSupplier() {
  const uploads = await prisma.priceUpload.findMany({
    where: { status: "done" },
    orderBy: { createdAt: "desc" },
    select: { id: true, supplierId: true },
  });
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const u of uploads) {
    if (seen.has(u.supplierId)) continue;
    seen.add(u.supplierId);
    ids.push(u.id);
  }
  return ids;
}

export async function GET(request: Request) {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform"); // "PS4" | "PS5" | "SWITCH" | null (все)
  const search = searchParams.get("search")?.trim();
  const supplierCountParam = searchParams.get("supplierCount");
  const supplierCountFilter = supplierCountParam ? Number(supplierCountParam) : null;
  const sortSupplierSlug = searchParams.get("sortSupplier")?.trim() || null;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const allSuppliers = await prisma.priceSupplier.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  const uploadIds = await latestUploadIdsPerSupplier();
  if (uploadIds.length === 0) {
    return NextResponse.json({ games: [], suppliers: allSuppliers, page: 1, pageSize: PAGE_SIZE, total: 0 });
  }

  // Игры, которых нет ни у одного другого поставщика (supplierCount = 1), обычным
  // сравнением по количеству поставщиков всегда уходят в конец и не попадают на
  // первую страницу — из-за этого клик по заголовку конкретного поставщика ничего
  // не сортирует, если у него много таких "эксклюзивных" позиций. Когда сортировка
  // запрошена по конкретному поставщику — сначала поднимаем игры, у которых есть
  // цена именно от него, независимо от общего числа поставщиков.
  const sortSupplierId = sortSupplierSlug
    ? (await prisma.priceSupplier.findUnique({ where: { slug: sortSupplierSlug }, select: { id: true } }))?.id ?? null
    : null;
  const sortSupplierUploadId = sortSupplierId
    ? (await prisma.priceUpload.findFirst({
        where: { supplierId: sortSupplierId, id: { in: uploadIds } },
        select: { id: true },
      }))?.id ?? null
    : null;

  const conditions: Prisma.Sql[] = [];
  if (platform) conditions.push(Prisma.sql`g.platform = ${platform}`);
  if (search) conditions.push(Prisma.sql`g."canonicalName" ILIKE ${`%${search}%`}`);
  const whereSql = conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;
  const havingSql =
    supplierCountFilter != null && Number.isFinite(supplierCountFilter)
      ? Prisma.sql`HAVING COUNT(DISTINCT pu."supplierId") = ${supplierCountFilter}`
      : Prisma.empty;

  // Считаем и фильтруем по количеству РАЗНЫХ поставщиков, у которых есть эта игра
  // в их текущей (последней) загрузке — а не по числу строк цен.
  const orderBySql = sortSupplierUploadId
    ? Prisma.sql`ORDER BY BOOL_OR(pe."uploadId" = ${sortSupplierUploadId}) DESC, "supplierCount" DESC, g."canonicalName" ASC`
    : Prisma.sql`ORDER BY "supplierCount" DESC, g."canonicalName" ASC`;

  const rows = await prisma.$queryRaw<Array<{ id: number; canonicalName: string; platform: string; supplierCount: bigint }>>`
    SELECT g.id, g."canonicalName", g.platform,
      COUNT(DISTINCT pu."supplierId") AS "supplierCount"
    FROM "Game" g
    JOIN "PriceEntry" pe ON pe."gameId" = g.id AND pe."uploadId" IN (${Prisma.join(uploadIds)})
    JOIN "PriceUpload" pu ON pu.id = pe."uploadId"
    ${whereSql}
    GROUP BY g.id
    ${havingSql}
    ${orderBySql}
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `;

  const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count FROM (
      SELECT g.id
      FROM "Game" g
      JOIN "PriceEntry" pe ON pe."gameId" = g.id AND pe."uploadId" IN (${Prisma.join(uploadIds)})
      JOIN "PriceUpload" pu ON pu.id = pe."uploadId"
      ${whereSql}
      GROUP BY g.id
      ${havingSql}
    ) sub
  `;
  const total = Number(totalRows[0]?.count ?? 0);

  const pageGameIds = rows.map((r) => r.id);
  const supplierCountByGame = new Map(rows.map((r) => [r.id, Number(r.supplierCount)]));

  const entries = pageGameIds.length
    ? await prisma.priceEntry.findMany({
        where: { uploadId: { in: uploadIds }, gameId: { in: pageGameIds } },
        include: { upload: { include: { supplier: true } } },
      })
    : [];

  type SupplierPrice = { supplierSlug: string; supplierName: string; price: number | null; inStock: boolean };

  const pricesByGame = new Map<number, Map<string, SupplierPrice>>();

  // Несколько строк прайса от одного поставщика (разные издания/регионы) могут сойтись
  // в одну игру — в таком случае для этого поставщика оставляем самую низкую цену,
  // а не первую попавшуюся, иначе подсветка минимума будет ошибаться.
  for (const entry of entries) {
    if (entry.gameId == null) continue;
    const price = entry.priceWholesale ?? entry.priceRetail ?? null;
    const supplierSlug = entry.upload.supplier.slug;

    let pricesBySupplier = pricesByGame.get(entry.gameId);
    if (!pricesBySupplier) {
      pricesBySupplier = new Map();
      pricesByGame.set(entry.gameId, pricesBySupplier);
    }

    const existing = pricesBySupplier.get(supplierSlug);
    const isCheaper = existing == null || (price != null && (existing.price == null || price < existing.price));
    if (isCheaper) {
      pricesBySupplier.set(supplierSlug, {
        supplierSlug,
        supplierName: entry.upload.supplier.name,
        price,
        inStock: entry.inStock,
      });
    }
  }

  const games = rows.map((g) => {
    const prices = Array.from((pricesByGame.get(g.id) ?? new Map()).values());
    const validPrices = prices
      .filter((p): p is typeof p & { price: number } => p.price != null)
      .map((p) => p.price);
    const minPrice = validPrices.length ? Math.min(...validPrices) : null;
    return {
      gameId: g.id,
      name: g.canonicalName,
      platform: g.platform,
      prices,
      minPrice,
      supplierCount: supplierCountByGame.get(g.id) ?? prices.length,
    };
  });

  return NextResponse.json({ games, suppliers: allSuppliers, page, pageSize: PAGE_SIZE, total });
}
