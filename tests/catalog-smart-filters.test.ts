import assert from "node:assert/strict";

import {
  CATALOG_SMART_FILTERS,
  getCatalogSmartFilterEntries,
} from "../lib/catalogSmartFilters";

assert.deepEqual(
  Object.keys(CATALOG_SMART_FILTERS).sort(),
  ["chipovannaya", "proshitaya", "v-nalichii", "vtoroy-geympad"].sort()
);

const visibleSlugs = ["nintendo-switch-oled", "nintendo-switch-lite", "all"];

assert.deepEqual(getCatalogSmartFilterEntries(visibleSlugs), [
  { slug: "nintendo-switch-oled", filter: "proshitaya" },
  { slug: "nintendo-switch-lite", filter: "proshitaya" },
  { slug: "all", filter: "v-nalichii" },
]);

assert.equal(
  getCatalogSmartFilterEntries(["xbox-series-s"]).some((entry) => String(entry.filter) === "s-podpiskoy"),
  false
);
