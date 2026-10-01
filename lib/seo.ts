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
  const suffix = label && !name.toLowerCase().includes(label.toLowerCase()) ? `, ${label}` : "";
  return truncateByWords(`${name}${suffix} — купить в Gameshop24`, 70);
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
