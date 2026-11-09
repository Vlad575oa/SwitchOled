import assert from "node:assert/strict";
import { getActiveQuickLinks } from "../lib/constants/quickLinks";

const visibleGames = getActiveQuickLinks(
  ["games", "nintendo-switch-oled", "all"],
  ["games", "nintendo-switch-oled"]
);

assert.deepEqual(
  visibleGames.map((link) => link.slug),
  ["all", "nintendo-switch-oled", "games"]
);

const emptyGamesCategory = getActiveQuickLinks(
  ["games", "all"],
  []
);

assert.deepEqual(
  emptyGamesCategory.map((link) => link.slug),
  ["all"]
);

const gamesAreAddedToLegacyConfig = getActiveQuickLinks(
  ["all", "nintendo-switch-oled"],
  ["all", "nintendo-switch-oled", "games"]
);

assert.deepEqual(
  gamesAreAddedToLegacyConfig.map((link) => link.slug),
  ["all", "nintendo-switch-oled", "games"]
);
