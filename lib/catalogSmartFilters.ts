export const CATALOG_SMART_FILTERS: Record<
  string,
  { q?: string; status?: string; title: string; desc: string; metaDesc: (categoryName: string) => string }
> = {
  proshitaya: {
    q: "прошитая",
    title: "Прошитые",
    desc: "Лучшие прошитые и чипованные консоли с гарантией.",
    metaDesc: (c) => `Прошитые ${c} с предустановленными играми и гарантией 1 год. Проверка перед отправкой, оплата наличными при получении, доставка по Москве и России.`,
  },
  chipovannaya: {
    q: "чипованная",
    title: "Чипованные",
    desc: "Консоли с установленным чипом для запуска любых игр.",
    metaDesc: (c) => `Чипованные ${c} с установленным чипом для запуска любых игр. Гарантия 1 год, проверка перед отправкой, оплата наличными при получении.`,
  },
  "v-nalichii": {
    status: "inStock",
    title: "В наличии",
    desc: "Товары в наличии с быстрой доставкой сегодня.",
    metaDesc: (c) => `${c[0].toUpperCase()}${c.slice(1)} в наличии: прошитые Nintendo Switch, игры и аксессуары. Доставка по Москве в день заказа, гарантия 1 год, оплата наличными.`,
  },
  "vtoroy-geympad": {
    q: "2-й геймпад",
    title: "С двумя геймпадами",
    desc: "Комплекты с дополнительным контроллером для игры вдвоём.",
    metaDesc: (c) => `${c[0].toUpperCase()}${c.slice(1)} в комплекте со вторым геймпадом — можно сразу играть вдвоём. Гарантия 1 год, оплата наличными при получении.`,
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
