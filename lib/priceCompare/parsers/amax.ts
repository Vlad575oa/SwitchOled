import { normalizeName, cleanText, detectPlatform, parsePrice } from "../normalize";
import type { ParsedRow, SupplierParser } from "../types";

// Заголовок вида: Артикул | Наименование | Кол-во шт. | Цена от 30шт. дисков | Цена до 30шт. дисков | Сумма
export const amaxParser: SupplierParser = {
  key: "amax",
  matchesFileName: (fileName) => /amax/i.test(fileName),
  matchesContent: (rows) =>
    rows.some((row) => row.some((cell) => typeof cell === "string" && /цена от 30шт/i.test(cell))),

  parse(rows) {
    const headerIdx = rows.findIndex((row) =>
      row.some((cell) => typeof cell === "string" && /цена от 30шт/i.test(cell))
    );
    if (headerIdx === -1) return [];

    const result: ParsedRow[] = [];
    let currentRegion = "";

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const [artikul, name, , priceFrom30, priceTo30] = row;

      // Строки-разделители регионов/платформ: заполнена только колонка "Наименование"
      if ((artikul == null || artikul === "") && typeof name === "string" && name.trim()) {
        currentRegion = name.trim();
        continue;
      }

      if (typeof name !== "string" || !name.trim()) continue;

      const rawName = cleanText(name);
      const priceWholesale = parsePrice(priceFrom30);
      const priceRetail = parsePrice(priceTo30);
      if (priceWholesale == null && priceRetail == null) continue;

      result.push({
        rawName,
        normalizedName: normalizeName(rawName),
        platform: detectPlatform(rawName, currentRegion),
        sku: artikul != null ? String(artikul) : null,
        priceRetail,
        priceWholesale,
        inStock: true,
      });
    }

    return result;
  },
};
