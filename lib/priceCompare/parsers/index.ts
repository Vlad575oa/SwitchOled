import { amaxParser } from "./amax";
import { katanaParser } from "./katana";
import { wholesaleParser } from "./wholesale";
import { games1cParser } from "./games1c";
import type { SupplierParser, SupplierParserKey } from "../types";

export const PARSERS: Record<SupplierParserKey, SupplierParser> = {
  amax: amaxParser,
  katana: katanaParser,
  wholesale: wholesaleParser,
  games1c: games1cParser,
};

const ALL_PARSERS = Object.values(PARSERS);

/**
 * Определяет поставщика: сначала по имени файла, затем по сигнатуре заголовков.
 * Возвращает null, если ни один парсер не подошёл — тогда нужен ручной выбор.
 */
export function detectParser(fileName: string, sheetRows: unknown[][]): SupplierParser | null {
  const byName = ALL_PARSERS.find((p) => p.matchesFileName(fileName));
  if (byName) return byName;

  const byContent = ALL_PARSERS.find((p) => p.matchesContent(sheetRows));
  return byContent ?? null;
}

export { amaxParser, katanaParser, wholesaleParser, games1cParser };
