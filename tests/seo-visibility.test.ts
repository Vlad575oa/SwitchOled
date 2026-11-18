import assert from "node:assert/strict";
import { getCategorySlugsVisibleInCatalog } from "../lib/categoryVisibility";
import { getCatalogSmartFilter } from "../lib/catalogSmartFilters";
import { resolveProductMetaTitle } from "../lib/seo";

const slugs = getCategorySlugsVisibleInCatalog([
  { id: 1, slug: "nintendo", parentId: null, productCount: 0 },
  { id: 2, slug: "nintendo-switch", parentId: 1, productCount: 0 },
  { id: 3, slug: "nintendo-switch-oled", parentId: 2, productCount: 4 },
  { id: 4, slug: "playstation", parentId: null, productCount: 0 },
]);

assert.deepEqual(slugs.sort(), ["nintendo", "nintendo-switch", "nintendo-switch-oled"].sort());
assert.equal(resolveProductMetaTitle("Прошитая Nintendo Switch OLED —", "Прошитая Nintendo Switch OLED"), "Nintendo Switch OLED — купить");
assert.equal(resolveProductMetaTitle("Nintendo Switch OLED купить", "Nintendo Switch OLED"), "Nintendo Switch OLED купить");
assert.equal(resolveProductMetaTitle("Nintendo Switch OLED — Switch OLED", "Nintendo Switch OLED"), "Nintendo Switch OLED");
assert.equal(getCatalogSmartFilter("nintendo-switch-oled", "proshitaya")?.title, "Прошитые");
assert.equal(getCatalogSmartFilter("no-such-category", "proshitaya"), null);
