import { Prisma } from "@prisma/client";

const CYR_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

const LAT_TO_CYR_WORDS: Record<string, string[]> = {
  nintendo: ["нинтендо"],
  switch: ["свитч", "свич"],
  oled: ["олед", "оled"],
  lite: ["лайт", "лит"],
  neon: ["неон"],
  mario: ["марио"],
  white: ["вайт", "белый", "белая"],
  gray: ["грей", "серый", "серая"],
  animal: ["энимал"],
  crossing: ["кроссинг"],
};

const CYR_TO_LAT_WORDS: Record<string, string[]> = {
  нинтендо: ["nintendo"],
  свитч: ["switch"],
  свич: ["switch"],
  олед: ["oled"],
  лайт: ["lite"],
  лит: ["lite"],
  неон: ["neon"],
  марио: ["mario"],
  белый: ["white"],
  белая: ["white"],
  серый: ["gray"],
  серая: ["gray"],
  энимал: ["animal"],
  кроссинг: ["crossing"],
};

function normalizeSearchText(input: string) {
  return input
    .toLowerCase()
    .replace(/[+/_.,;:()\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function transliterateToLatin(input: string) {
  return input
    .split("")
    .map((char) => CYR_TO_LAT[char] ?? char)
    .join("");
}

function replaceWords(
  input: string,
  dictionary: Record<string, string[]>
) {
  const words = normalizeSearchText(input).split(" ").filter(Boolean);
  const variants = new Set<string>();

  variants.add(words.join(" "));
  const replaced = words.map((word) => dictionary[word]?.[0] ?? word).join(" ");
  variants.add(replaced);

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const replacements = dictionary[word] ?? [];
    for (const replacement of replacements) {
      const next = [...words];
      next[index] = replacement;
      variants.add(next.join(" "));
    }
  }

  return Array.from(variants).filter(Boolean);
}

function getTokenVariants(token: string) {
  const normalized = normalizeSearchText(token);
  if (!normalized) return [];

  const variants = new Set<string>([normalized]);

  for (const variant of replaceWords(normalized, LAT_TO_CYR_WORDS)) {
    variants.add(variant);
  }

  for (const variant of replaceWords(normalized, CYR_TO_LAT_WORDS)) {
    variants.add(variant);
  }

  variants.add(transliterateToLatin(normalized));

  if (normalized === "switch2") {
    variants.add("switch 2");
  }

  if (normalized === "switch 2") {
    variants.add("switch2");
  }

  return Array.from(variants).filter((variant) => variant.length >= 1);
}

export function getSearchQueryVariants(query: string) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  return getTokenVariants(normalized).filter((variant) => variant.length >= 2);
}

export function buildProductSearchWhere(query: string): Prisma.ProductWhereInput | undefined {
  const normalized = normalizeSearchText(query);
  if (!normalized) return undefined;

  const tokens = normalized.split(" ").filter(Boolean);
  const tokenConditions = tokens
    .map((token) => {
      const variants = getTokenVariants(token);
      if (!variants.length) return null;

      return {
        OR: variants.flatMap((variant) => [
          { name: { contains: variant, mode: "insensitive" } },
          { sku: { contains: variant, mode: "insensitive" } },
          { category: { name: { contains: variant, mode: "insensitive" } } },
        ]),
      } satisfies Prisma.ProductWhereInput;
    })
    .filter(Boolean) as Prisma.ProductWhereInput[];

  if (!tokenConditions.length) return undefined;

  if (tokenConditions.length === 1) {
    return tokenConditions[0];
  }

  return { AND: tokenConditions };
}
