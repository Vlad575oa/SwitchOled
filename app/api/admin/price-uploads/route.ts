import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/adminSession";
import { readWorkbookRows } from "@/lib/priceCompare/readWorkbook";
import { detectParser, PARSERS } from "@/lib/priceCompare/parsers";
import { matchRow } from "@/lib/priceCompare/match";
import type { SupplierParserKey } from "@/lib/priceCompare/types";

export async function GET() {
  const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uploads = await prisma.priceUpload.findMany({
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(uploads);
}

export async function POST(request: Request) {
  try {
    const session = await verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const fd = await request.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    const forcedSupplierSlug = (fd.get("supplierSlug") as string) || null;
    // parserKey задаёт ФОРМАТ файла и может отличаться от supplierSlug — так загрузка
    // для проверочного столбца может использовать формат любого из существующих поставщиков,
    // но записываться будет за отдельного (проверочного) поставщика.
    const forcedParserKey = (fd.get("parserKey") as string) || forcedSupplierSlug;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

    const rows = readWorkbookRows(buffer);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Не удалось прочитать файл" }, { status: 400 });
    }

    const parser = forcedParserKey
      ? PARSERS[forcedParserKey as SupplierParserKey] ?? null
      : detectParser(file.name, rows);

    if (!parser) {
      return NextResponse.json(
        {
          error: "SUPPLIER_UNKNOWN",
          message: "Не удалось определить поставщика по файлу. Выберите вручную.",
          suppliers: await prisma.priceSupplier.findMany({ orderBy: { name: "asc" } }),
          preview: rows.slice(0, 10),
        },
        { status: 422 }
      );
    }

    const supplierSlug = forcedSupplierSlug || parser.key;
    const supplier = await prisma.priceSupplier.findUnique({ where: { slug: supplierSlug } });
    if (!supplier) {
      return NextResponse.json({ error: `Поставщик "${supplierSlug}" не настроен в базе` }, { status: 500 });
    }

    // Цены обновляются раз в неделю новым файлом — проверку на повторную загрузку
    // намеренно не делаем, менеджеры перезаливают прайсы регулярно.
    const parsedRows = parser.parse(rows);
    if (parsedRows.length === 0) {
      return NextResponse.json({ error: "В файле не найдено ни одной строки с ценой" }, { status: 400 });
    }

    const upload = await prisma.priceUpload.create({
      data: {
        supplierId: supplier.id,
        fileName: file.name,
        fileHash,
        status: "processing",
        rowsTotal: parsedRows.length,
        uploadedBy: session.r ?? null,
      },
    });

    let matched = 0;
    let pending = 0;

    for (const row of parsedRows) {
      const match = await matchRow(row);
      if (match.matchStatus === "auto") matched++;
      else pending++;

      await prisma.priceEntry.create({
        data: {
          uploadId: upload.id,
          gameId: match.gameId,
          rawName: row.rawName,
          normalizedName: row.normalizedName,
          platform: row.platform,
          sku: row.sku,
          priceRetail: row.priceRetail,
          priceWholesale: row.priceWholesale,
          inStock: row.inStock,
          matchStatus: match.matchStatus,
          matchScore: match.matchScore,
        },
      });
    }

    const updatedUpload = await prisma.priceUpload.update({
      where: { id: upload.id },
      data: { status: "done", rowsMatched: matched, rowsPending: pending },
    });

    return NextResponse.json(updatedUpload);
  } catch (error) {
    console.error("price-uploads POST error", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
