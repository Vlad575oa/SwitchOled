import assert from "node:assert/strict";

import { groupCartEventsByDate } from "../lib/admin/cartEventStats";

const grouped = groupCartEventsByDate([
  { createdAt: new Date("2026-06-03T09:10:00+03:00"), source: "catalog_grid" },
  { createdAt: new Date("2026-06-03T12:45:00+03:00"), source: "product_page" },
  { createdAt: new Date("2026-06-03T18:15:00+03:00"), source: "product_page" },
  { createdAt: new Date("2026-06-02T23:50:00+03:00"), source: "catalog_grid" },
]);

assert.deepEqual(grouped, [
  {
    dateKey: "2026-06-03",
    dateLabel: "03.06.2026",
    total: 3,
    grid: 1,
    page: 2,
  },
  {
    dateKey: "2026-06-02",
    dateLabel: "02.06.2026",
    total: 1,
    grid: 1,
    page: 0,
  },
]);

console.log("cart-event-stats.test.ts passed");
