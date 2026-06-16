import assert from "node:assert/strict";
import { getCategorySeoContent } from "../lib/categorySeoContent";

const oled = getCategorySeoContent("nintendo-switch-oled");
assert.ok(oled, "Expected SEO content for Nintendo Switch OLED");
assert.equal(oled?.intro.title, "Прошитая Nintendo Switch OLED");
assert.equal(oled?.faqs.length, 4);
assert.ok(
  oled?.internalLinks.some((link) => link.href === "/blog/nintendo-switch-oled-vs-lite-chto-vybrat-2026"),
  "Expected OLED content to link to comparison article"
);

const lite = getCategorySeoContent("nintendo-switch-lite");
assert.ok(lite, "Expected SEO content for Nintendo Switch Lite");
assert.equal(lite?.compare.items.length, 4);

const other = getCategorySeoContent("nintendo-switch");
assert.equal(other, null);
