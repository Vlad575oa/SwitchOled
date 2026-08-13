import { normalizeName, cleanText, detectPlatform, parsePrice } from "../normalize";
import type { ParsedRow, SupplierParser } from "../types";

// Заголовок вида: Артикул | (платформа) | Наименование | Цена Карго Доставкой | Заказ | Итого
export const katanaParser: SupplierParser = {
  key: "katana",
  matchesFileName: (fileName) => /katana/i.test(fileName),
  matchesContent: (rows) =>
    rows.some((row) => row.some((cell) => typeof cell === "string" && /цена карго доставкой/i.test(cell))),

  parse(rows) {
    const headerIdx = rows.findIndex((row) =>
      row.some((cell) => typeof cell === "string" && /цена карго доставкой/i.test(cell))
    );
    if (headerIdx === -1) return [];

    const result: ParsedRow[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const [artikul, platformCell, name, price] = row;

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
