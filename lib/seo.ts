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

export function buildProductMetaTitle(name: string): string {
  return truncateByWords(`${name} — Купить в Gameshop24`, 70);
}

export function buildProductMetaDescription(params: {
  name: string;
  categoryName?: string | null;
  sourceDescription?: string | null;
}) {
  const raw = stripHtml(params.sourceDescription);
  if (raw) return truncateByWords(raw, 160);
  const categoryPart = params.categoryName ? `в категории ${params.categoryName}` : "в нашем каталоге";
  return truncateByWords(
    `${params.name} ${categoryPart}. Официальная гарантия, проверка перед отправкой и быстрая доставка по России.`,
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

