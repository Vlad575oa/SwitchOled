export const CATALOG_SMART_FILTERS: Record<
  string,
  { q?: string; status?: string; title: string; desc: string }
> = {
  proshitaya: {
    q: "прошитая",
    title: "Прошитые",
    desc: "Лучшие прошитые и чипованные консоли с гарантией.",
  },
  chipovannaya: {
    q: "чипованная",
    title: "Чипованные",
    desc: "Консоли с установленным чипом для запуска любых игр.",
  },
  "v-nalichii": {
    status: "inStock",
    title: "В наличии",
    desc: "Товары в наличии с быстрой доставкой сегодня.",
  },
  "vtoroy-geympad": {
    q: "2-й геймпад",
    title: "С двумя геймпадами",
    desc: "Комплекты с дополнительным контроллером для игры вдвоём.",
  },
};

const CATALOG_SMART_FILTER_TARGETS = [
  { slug: "nintendo-switch-oled", filter: "proshitaya" },
  { slug: "nintendo-switch-v2", filter: "proshitaya" },
  { slug: "nintendo-switch-lite", filter: "proshitaya" },
  { slug: "all", filter: "v-nalichii" },
] as const;

export function getCatalogSmartFilter(categorySlug: string, filterSlug: string) {
  const target = CATALOG_SMART_FILTER_TARGETS.find(
    (entry) => entry.slug === categorySlug && entry.filter === filterSlug
  );
  return target ? CATALOG_SMART_FILTERS[target.filter] : null;
}

export function getCatalogSmartFilterEntries(visibleSlugs: string[]) {
  const visible = new Set(visibleSlugs);

  return CATALOG_SMART_FILTER_TARGETS.filter(
    ({ slug, filter }) => (slug === "all" || visible.has(slug)) && filter in CATALOG_SMART_FILTERS
  ).map(({ slug, filter }) => ({ slug, filter }));
}
