/**
 * Ссылки на объявления Авито, доступные из карточек товаров.
 * Заполняем только для тех товаров, где нужно показывать кнопку.
 * Лимит — 4 объявления.
 */
export const AVITO_LINKS: Record<string, string> = {
  "nintendo-switch-oled-white-512gb-az":
    "https://www.avito.ru/moskva/igry_pristavki_i_programmy/proshityy_nintendo_switch_oled_white_512gb_8419397163",
  "nintendo-switch-oled-white-256gb-az":
    "https://www.avito.ru/moskva/igry_pristavki_i_programmy/proshityy_nintendo_switch_oled_white_256gb_8376885986",
  "nintendo-switch-oled-neon-512gb-az":
    "https://www.avito.ru/moskva/igry_pristavki_i_programmy/proshityy_nintendo_switch_oled_neon_512gb_8346249715",
  "nintendo-switch-oled-neon-256gb-az":
    "https://www.avito.ru/moskva/igry_pristavki_i_programmy/proshityy_nintendo_switch_oled_neon_256gb_8306746973",
};

export function getAvitoUrl(slug: string) {
  return AVITO_LINKS[slug] ?? null;
}
