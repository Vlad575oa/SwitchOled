import { buildYmlFeedResponse } from "@/lib/yandexFeed";

export const dynamic = "force-dynamic";

// Nintendo Switch OLED/Lite offers with the 2026-11-07 ad cards as the first picture.
const NINTENDO_SWITCH_CARD_PRODUCT_IDS = [
  // OLED Neon
  204, 159, 184, 157, 62,
  // OLED White
  205, 60, 59, 58, 55,
  // OLED Splatoon 3
  40, 54, 53, 52, 51,
  // OLED Mario Edition
  198, 199, 200, 201, 202,
  // Lite Gray
  194, 162, 43, 161, 42,
  // Lite Blue
  195, 57, 50, 61, 196,
  // Lite Pink
  193, 163, 41, 44, 64,
  // Lite Turquoise
  49, 192, 191, 190, 160,
  // Lite Yellow
  197, 45, 56, 63, 65,
];

export async function GET() {
  return buildYmlFeedResponse({ id: { in: NINTENDO_SWITCH_CARD_PRODUCT_IDS } });
}
