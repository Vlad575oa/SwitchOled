import { normalizeName, cleanText, detectPlatform, parsePrice } from "../normalize";
import type { ParsedRow, SupplierParser } from "../types";

// Заголовок вида: Наименование | Цена (руб.) | Заказ | наличие | Примечание | Артикул
export const wholesaleParser: SupplierParser = {
  key: "wholesale",
  matchesFileName: (fileName) => /оптов.*прайс/i.test(fileName),
  matchesContent: (rows) =>
    rows.some((row) => row.some((cell) => typeof cell === "string" && /^наличие$/i.test(cell.trim()))),

  parse(rows) {
    const headerIdx = rows.findIndex((row) =>
      row.some((cell) => typeof cell === "string" && /^наличие$/i.test(cell.trim()))
    );
    if (headerIdx === -1) return [];

    const result: ParsedRow[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const [name, price, , availability, , sku] = row;

      if (typeof name !== "string" || !name.trim()) continue;

      const priceValue = parsePrice(price);
      if (priceValue == null) continue; // категории-разделители без цены пропускаем

      const rawName = cleanText(name);
      const availabilityText = typeof availability === "string" ? availability.toLowerCase() : "";

      result.push({
        rawName,
        normalizedName: normalizeName(rawName),
        platform: detectPlatform(rawName),
        sku: sku != null ? String(sku) : null,
        priceRetail: priceValue,
        priceWholesale: null,
        inStock: availabilityText.includes("в наличии"),
      });
    }

    return result;
  },
};
