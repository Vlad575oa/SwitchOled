export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncateByWords(input: string, maxLength: number): string {
  const text = input.trim();
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  const cut = lastSpace > 0 ? shortened.slice(0, lastSpace) : shortened.slice(0, maxLength);
  return cut.trim().replace(/[.,;:!?-]+$/g, "");
}

export function buildProductMetaTitle(name: string, variantLabel?: string | null): string {
  const label = variantLabel?.trim();
  const normalizedName = name.trim();
  const storageMatches = normalizedName.match(/\b\d+\s*(?:GB|TB)\b/gi) ?? [];
  const storage = storageMatches[storageMatches.length - 1]?.replace(/\s+/g, " ") ?? "";
  const gameCount = normalizedName.match(/\+(\d+)\s*Игр?/i)?.[1] ?? "";
  const shortName = normalizedName
    .replace(/^Прошитая\s+/i, "")
    .replace(/\s*\+\s*\d+\s*Игр?/gi, "")
    .replace(/\s*32GB\s*\+\s*MicroSD\s*\d+\s*GB/gi, storage ? ` ${storage}` : "")
    .replace(/\s*\+\s*MicroSD\s*\d+\s*GB/gi, storage ? ` ${storage}` : "")
    .replace(/\s+/g, " ")
    .trim();
  const normalizedColorName = label
    ? shortName.replace(
        /(бирюзовый|розовый|серый|синий|желтый|жёлтый|белый|white|black|neon|красный|зелёный|зеленый)/i,
        label,
      )
    : shortName;
  const variantSuffix = label && !normalizedColorName.toLowerCase().includes(label.toLowerCase())
    ? `, цвет ${label}`
    : "";
  const gameSuffix = gameCount ? `, ${gameCount} игр` : "";
  const ending = " — Gameshop24";

  // Keep the variant inside the title limit. Truncating the full string used
  // to remove the color from long product names and create rendered duplicates.
  const maxNameLength = 70 - ending.length - variantSuffix.length - gameSuffix.length;
  const compactName = truncateByWords(normalizedColorName, Math.max(24, maxNameLength));
  return truncateByWords(`${compactName}${variantSuffix}${gameSuffix}${ending}`, 70);
}

export function resolveProductMetaTitle(
  metaTitle: string | null | undefined,
  name: string,
  variantLabel?: string | null
): string {
  const normalized = metaTitle?.trim() ?? "";
  if (!normalized || /(?:[-–—|:]\s*)$/.test(normalized)) return buildProductMetaTitle(name, variantLabel);
  return normalized;
}

export function buildProductMetaDescription(params: {
  name: string;
  categoryName?: string | null;
  variantLabel?: string | null;
  sourceDescription?: string | null;
}) {
  const label = params.variantLabel?.trim();
  const variantPart = label && !params.name.toLowerCase().includes(label.toLowerCase()) ? `, цвет ${label}` : "";
  const categoryPart = params.categoryName ? `в категории ${params.categoryName}` : "в нашем каталоге";
  return truncateByWords(
    `${params.name}${variantPart} — купить ${categoryPart}. Гарантия 1 год, проверка перед отправкой и доставка по России.`,
    160
  );
}

export function normalizeCopySlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/-copy(?:-[a-z0-9]+)*/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}
