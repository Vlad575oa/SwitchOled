export const ALL_QUICK_LINKS = [
  { label: "Все товары",            href: "/catalog/all",                    slug: "all" },
  { label: "Nintendo",              href: "/catalog/nintendo",               slug: "nintendo" },
  { label: "Nintendo Switch 2",     href: "/catalog/nintendo-switch-2",      slug: "nintendo-switch-2" },
  { label: "Nintendo Switch",       href: "/catalog/nintendo-switch",        slug: "nintendo-switch" },
  { label: "Nintendo Switch OLED",  href: "/catalog/nintendo-switch-oled",   slug: "nintendo-switch-oled" },
  { label: "Nintendo Switch Lite",  href: "/catalog/nintendo-switch-lite",   slug: "nintendo-switch-lite" },
  { label: "Игры",                  href: "/catalog/games",                  slug: "games" },
  { label: "PlayStation",           href: "/catalog/playstation",            slug: "playstation" },
  { label: "Xbox",                  href: "/catalog/xbox",                   slug: "xbox" },
  { label: "Геймпады",              href: "/catalog/gamepads",               slug: "gamepads" },
  { label: "Аксессуары",            href: "/catalog/accessories",            slug: "accessories" },
] as const;

export type QuickLink = typeof ALL_QUICK_LINKS[number];

export function getActiveQuickLinks(
  enabledSlugs: string[],
  visibleSlugs: string[]
): QuickLink[] {
  const configured = enabledSlugs.length > 0
    ? enabledSlugs
    : ALL_QUICK_LINKS.map((link) => link.slug);

  // Games are a first-class catalog section and should stay discoverable in
  // the quick navigation whenever at least one game is available. This also
  // keeps the link visible while cached page settings catch up with the DB.
  const enabled = visibleSlugs.includes("games") && !configured.includes("games")
    ? [...configured, "games"]
    : configured;

  return ALL_QUICK_LINKS.filter(
    (link) =>
      enabled.includes(link.slug) &&
      (link.slug === "all" || visibleSlugs.includes(link.slug))
  );
}
