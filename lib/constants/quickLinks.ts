export const ALL_QUICK_LINKS = [
  { label: "Все товары",        href: "/catalog/all",               slug: "all" },
  { label: "Nintendo",          href: "/catalog/nintendo",          slug: "nintendo" },
  { label: "Nintendo Switch 2", href: "/catalog/nintendo-switch-2", slug: "nintendo-switch-2" },
  { label: "Nintendo Switch",   href: "/catalog/nintendo-switch",   slug: "nintendo-switch" },
  { label: "PlayStation",       href: "/catalog/playstation",       slug: "playstation" },
  { label: "Xbox",              href: "/catalog/xbox",              slug: "xbox" },
  { label: "Геймпады",          href: "/catalog/gamepads",          slug: "gamepads" },
  { label: "Аксессуары",        href: "/catalog/accessories",       slug: "accessories" },
] as const;

export type QuickLink = typeof ALL_QUICK_LINKS[number];
