import assert from "node:assert/strict";
import { getCategorySlugsVisibleInCatalog } from "../lib/categoryVisibility";
import { resolveProductMetaTitle } from "../lib/seo";

const slugs = getCategorySlugsVisibleInCatalog([
  { id: 1, slug: "nintendo", parentId: null, productCount: 0 },
  { id: 2, slug: "nintendo-switch", parentId: 1, productCount: 0 },
  { id: 3, slug: "nintendo-switch-oled", parentId: 2, productCount: 4 },
  { id: 4, slug: "playstation", parentId: null, productCount: 0 },
]);

assert.deepEqual(slugs.sort(), ["nintendo", "nintendo-switch", "nintendo-switch-oled"].sort());
assert.equal(resolveProductMetaTitle("Прошитая Nintendo Switch OLED —", "Прошитая Nintendo Switch OLED"), "Прошитая Nintendo Switch OLED — Купить в Gameshop24");
assert.equal(resolveProductMetaTitle("Nintendo Switch OLED купить", "Nintendo Switch OLED"), "Nintendo Switch OLED купить");
