export type ParsedRow = {
  rawName: string;
  normalizedName: string;
  platform: string | null;
  sku: string | null;
  priceRetail: number | null;
  priceWholesale: number | null;
  inStock: boolean;
};

export type SupplierParserKey = "amax" | "katana" | "wholesale" | "games1c" | "gameuae";

export type SupplierParser = {
  key: SupplierParserKey;
  /** Быстрая проверка по имени файла. */
  matchesFileName: (fileName: string) => boolean;
  /** Проверка по содержимому (заголовки листа), используется если имя файла не распознано. */
  matchesContent: (sheetRows: unknown[][]) => boolean;
  parse: (sheetRows: unknown[][]) => ParsedRow[];
};
