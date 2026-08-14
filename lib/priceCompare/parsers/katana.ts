import { normalizeName, cleanText, detectPlatform, parsePrice } from "../normalize";
import type { ParsedRow, SupplierParser } from "../types";

const PRICE_HEADER = /цена карго доставкой/i;

// Колонки ищутся по заголовку, а не по фиксированной позиции — формат прайса
// периодически меняется (добавляются/убираются/переставляются столбцы).
const COLUMN_PATTERNS = {
  sku: /^артикул$/i,
  platform: /^\(?платформа\)?$/i,
  name: /^наименование$/i,
  price: PRICE_HEADER,
} as const;

type ColumnKey = keyof typeof COLUMN_PATTERNS;

function findHeaderRow(rows: unknown[][]): number {
  return rows.findIndex((row) => row.some((cell) => typeof cell === "string" && PRICE_HEADER.test(cell)));
}

function mapColumns(headerRow: unknown[]): Partial<Record<ColumnKey, number>> {
  const columns: Partial<Record<ColumnKey, number>> = {};
  headerRow.forEach((cell, idx) => {
    if (typeof cell !== "string") return;
    const header = cell.trim();
    for (const [key, pattern] of Object.entries(COLUMN_PATTERNS) as [ColumnKey, RegExp][]) {
      if (columns[key] == null && pattern.test(header)) columns[key] = idx;
    }
  });
  return columns;
}

// Заголовок вида: Артикул | (платформа) | Наименование | Цена Карго Доставкой | Заказ | Итого
export const katanaParser: SupplierParser = {
  key: "katana",
  matchesFileName: (fileName) => /katana/i.test(fileName),
  matchesContent: (rows) => findHeaderRow(rows) !== -1,

  parse(rows) {
    const headerIdx = findHeaderRow(rows);
    if (headerIdx === -1) return [];

    const columns = mapColumns(rows[headerIdx]);
    if (columns.name == null || columns.price == null) return [];

    const result: ParsedRow[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const name = row[columns.name];
      const price = row[columns.price];
      const platformCell = columns.platform != null ? row[columns.platform] : null;
      const artikul = columns.sku != null ? row[columns.sku] : null;

      if (typeof name !== "string" || !name.trim()) continue;

      const priceValue = parsePrice(price);
      if (priceValue == null) continue; // строки-акции без цены пропускаем

      const rawName = cleanText(name);
      result.push({
        rawName,
        normalizedName: normalizeName(rawName),
        platform: detectPlatform(typeof platformCell === "string" ? platformCell : "", rawName),
        sku: artikul != null ? String(artikul) : null,
        priceRetail: priceValue,
        priceWholesale: null,
        inStock: true,
      });
    }

    return result;
  },
};
