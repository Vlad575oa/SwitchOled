const NOISE_PATTERNS: RegExp[] = [
  /\(рус\.?\s*обложка\)/gi,
  /\(rus\s*sub\)/gi,
  /\(eng\s*lang\)/gi,
  /\(eng\s*sub\)/gi,
  /\(original\)/gi,
  /CUSA\s*\d+/gi,
  /PPSA\s*\d+/gi,
  /CUSA-\d+/gi,
];

const PLATFORM_PATTERNS: { platform: string; pattern: RegExp }[] = [
  { platform: "PS5", pattern: /\bPS ?5\b|\bPLAYSTATION ?5\b|\bPPSA\b/i },
  { platform: "PS4", pattern: /\bPS ?4\b|\bPLAYSTATION ?4\b|\bCUSA\b/i },
  { platform: "SWITCH", pattern: /\bSWITCH ?2?\b|\bNINTENDO SWITCH\b|\bNS ?2?\b/i },
  { platform: "PSP", pattern: /\bPSP\b/i },
  { platform: "XBOX", pattern: /\bXBOX\b/i },
];

/** Убирает лишние пробелы, приводит к единому регистру, схлопывает whitespace. */
export function cleanText(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim();
}

/** Строка для сопоставления игр: без региональных пометок/кодов изданий, без пробельного мусора. */
export function normalizeName(raw: string): string {
  let text = cleanText(raw);
  for (const p of NOISE_PATTERNS) text = text.replace(p, " ");
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Пытается определить платформу по названию/дополнительному тексту. */
export function detectPlatform(...texts: (string | null | undefined)[]): string | null {
  const combined = texts.filter(Boolean).join(" ");
  for (const { platform, pattern } of PLATFORM_PATTERNS) {
    if (pattern.test(combined)) return platform;
  }
  return null;
}

/** Парсит число цены из ячейки, устойчиво к строкам вида "1 100", "1100.50", null/undefined. */
export function parsePrice(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : null;
  const cleaned = String(value).replace(/[^\d.,]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? Math.round(num) : null;
}
