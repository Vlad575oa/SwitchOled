/**
 * Служебные атрибуты товара хранятся в том же JSON `attributes`,
 * но начинаются с "__" и не показываются ни в админке, ни на сайте.
 */
export const SERVICE_ATTR_PREFIX = "__";
export const VARIANT_GROUP_KEY = "__variantGroupId";
export const AVITO_URL_KEY = "__avitoUrl";

export const isServiceAttr = (key: string) => key.startsWith(SERVICE_ATTR_PREFIX);

export function publicAttributes(
  attrs: Record<string, unknown> | null | undefined
): Record<string, string> {
  if (!attrs || typeof attrs !== "object") return {};
  return Object.fromEntries(
    Object.entries(attrs)
      .filter(([key]) => !isServiceAttr(key))
      .map(([key, value]) => [key, String(value)])
  );
}

export function readAvitoUrl(attrs: unknown): string | null {
  if (!attrs || typeof attrs !== "object") return null;
  const value = (attrs as Record<string, unknown>)[AVITO_URL_KEY];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function isValidAvitoUrl(url: string) {
  try {
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol) && /(^|\.)avito\.ru$/.test(parsed.hostname);
  } catch {
    return false;
  }
}
