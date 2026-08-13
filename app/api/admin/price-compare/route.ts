import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";

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

  const allSuppliers = await prisma.priceSupplier.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  const uploadIds = await latestUploadIdsPerSupplier();
  if (uploadIds.length === 0) return NextResponse.json({ games: [], suppliers: allSuppliers });

  const entries = await prisma.priceEntry.findMany({
    where: {
      uploadId: { in: uploadIds },
      gameId: { not: null },
      ...(platform ? { game: { platform } } : {}),
    },
    include: {
      game: true,
      upload: { include: { supplier: true } },
    },
  });

  type SupplierPrice = { supplierSlug: string; supplierName: string; price: number | null; inStock: boolean };

  const byGame = new Map<number, {
    gameId: number;
    name: string;
    platform: string;
    pricesBySupplier: Map<string, SupplierPrice>;
  }>();

  // Несколько строк прайса от одного поставщика (разные издания/регионы) могут сойтись
  // в одну игру — в таком случае для этого поставщика оставляем самую низкую цену,
  // а не первую попавшуюся, иначе подсветка минимума будет ошибаться.
  for (const entry of entries) {
    if (!entry.game) continue;
    const price = entry.priceWholesale ?? entry.priceRetail ?? null;
    const supplierSlug = entry.upload.supplier.slug;

    let bucket = byGame.get(entry.game.id);
    if (!bucket) {
      bucket = { gameId: entry.game.id, name: entry.game.canonicalName, platform: entry.game.platform, pricesBySupplier: new Map() };
      byGame.set(entry.game.id, bucket);
    }

    const existing = bucket.pricesBySupplier.get(supplierSlug);
    const isCheaper = existing == null || (price != null && (existing.price == null || price < existing.price));
    if (isCheaper) {
      bucket.pricesBySupplier.set(supplierSlug, {
        supplierSlug,
        supplierName: entry.upload.supplier.name,
        price,
        inStock: entry.inStock,
      });
    }
  }

  const games = Array.from(byGame.values()).map((g) => {
    const prices = Array.from(g.pricesBySupplier.values());
    const validPrices = prices
      .filter((p): p is typeof p & { price: number } => p.price != null)
      .map((p) => p.price);
    const minPrice = validPrices.length ? Math.min(...validPrices) : null;
    return { gameId: g.gameId, name: g.name, platform: g.platform, prices, minPrice };
  });

  games.sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return NextResponse.json({ games, suppliers: allSuppliers });
}
