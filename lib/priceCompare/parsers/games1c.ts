import { normalizeName, cleanText, detectPlatform, parsePrice } from "../normalize";
import type { ParsedRow, SupplierParser } from "../types";

const HEADER_MATCH = /номенклатура\.родитель/i;

function findColumns(headerRow: unknown[]) {
  const idx = (pattern: RegExp) =>
    headerRow.findIndex((cell) => typeof cell === "string" && pattern.test(cell));

  return {
    artikul: idx(/номенклатура\.артикул/i),
    parent: idx(/номенклатура\.родитель/i),
    name: idx(/^\s*номенклатура\s*$/i),
    priceNal: idx(/оптовые-?\s*нал/i),
    priceBeznal: idx(/оптовые-?\s*безнал/i),
  };
}

// Заголовок вида (выгрузка 1С):
// Номенклатура.Артикул | Номенклатура.Код | Номенклатура.Родитель | Номенклатура | Заказ | Оптовые- Нал (Руб.) | Оптовые-Безнал(Руб.) | Доп. информация
// Позиция ведущей пустой колонки нестабильна между экспортами, поэтому колонки ищем по заголовкам, а не по индексу.
export const games1cParser: SupplierParser = {
  key: "games1c",
  matchesFileName: (fileName) => /прайс.*игр/i.test(fileName),
  matchesContent: (rows) => rows.some((row) => row.some((cell) => typeof cell === "string" && HEADER_MATCH.test(cell))),

  parse(rows) {
    const headerIdx = rows.findIndex((row) => row.some((cell) => typeof cell === "string" && HEADER_MATCH.test(cell)));
    if (headerIdx === -1) return [];

    const cols = findColumns(rows[headerIdx]);
    if (cols.name === -1) return [];

    const result: ParsedRow[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const name = row[cols.name];
      const parent = cols.parent !== -1 ? row[cols.parent] : null;
      const artikul = cols.artikul !== -1 ? row[cols.artikul] : null;

      if (typeof name !== "string" || !name.trim()) continue;

      const priceRetail = cols.priceNal !== -1 ? parsePrice(row[cols.priceNal]) : null;
      const priceWholesale = cols.priceBeznal !== -1 ? parsePrice(row[cols.priceBeznal]) : null;
      if (priceRetail == null && priceWholesale == null) continue; // строки-категории без цены

      const rawName = cleanText(name);
      result.push({
        rawName,
        normalizedName: normalizeName(rawName),
        platform: detectPlatform(rawName, typeof parent === "string" ? parent : ""),
        sku: artikul != null && artikul !== "" ? String(artikul) : null,
        priceRetail,
        priceWholesale,
        inStock: true,
      });
    }

    return result;
  },
};
