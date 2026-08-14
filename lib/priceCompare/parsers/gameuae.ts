import { normalizeName, cleanText, parsePrice } from "../normalize";
import type { ParsedRow, SupplierParser } from "../types";

// Заголовок вида: № | Код | Название | Категория | Цена | Валюта
// Каталог общий (консоли, аксессуары, игры вперемешку) — по имени их не различить
// (аксессуары и консоли тоже начинаются с "PS4"/"SW" и т.п.), поэтому берём только строки
// из категорий "<платформа> games". Остальные разделы (нет в наличии/лучшая цена/базовый
// ассортимент) содержат смесь игр и аксессуаров без надёжного признака — пропускаем.
const GAME_CATEGORY = /\bgames$/i;
const PLATFORM_PREFIX = /^(PS5|PS4|SW2|SW|XBOX)\b\s*/i;
const CATEGORY_TO_PLATFORM: Record<string, string> = {
  "ps5 games": "PS5",
  "ps4 games": "PS4",
  "sw games": "SWITCH",
  "sw2 games": "SWITCH",
  "xbox games": "XBOX",
};

export const gameuaeParser: SupplierParser = {
  key: "gameuae",
  matchesFileName: (fileName) => /gameuae/i.test(fileName),
  matchesContent: (rows) =>
    rows.some(
      (row) =>
        row.some((cell) => typeof cell === "string" && /^название$/i.test(cell.trim())) &&
        row.some((cell) => typeof cell === "string" && /^категория$/i.test(cell.trim()))
    ),

  parse(rows) {
    const headerIdx = rows.findIndex((row) =>
      row.some((cell) => typeof cell === "string" && /^название$/i.test(cell.trim()))
    );
    if (headerIdx === -1) return [];

    const result: ParsedRow[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const [, code, name, category, price] = row;

      if (typeof name !== "string" || !name.trim()) continue;
      if (typeof category !== "string" || !GAME_CATEGORY.test(category.trim())) continue;

      const categoryText = category.trim().toLowerCase();
      const platform = CATEGORY_TO_PLATFORM[categoryText];
      if (!platform) continue;

      const rawName = cleanText(name.replace(PLATFORM_PREFIX, ""));
      if (!rawName) continue;

      const priceValue = parsePrice(price);
      if (priceValue == null) continue;

      result.push({
        rawName,
        normalizedName: normalizeName(rawName),
        platform,
        sku: code != null ? String(code) : null,
        priceRetail: priceValue,
        priceWholesale: null,
        inStock: true,
      });
    }

    return result;
  },
};
