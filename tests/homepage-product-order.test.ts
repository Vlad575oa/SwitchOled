import assert from "node:assert/strict";

const fakeProducts = [
  {
    id: 1,
    name: "Nintendo под заказ",
    images: ["/images/on-order.webp"],
    inStock: false,
    createdAt: new Date("2026-12-31T00:00:00.000Z"),
    category: { slug: "nintendo-switch" },
  },
  {
    id: 2,
    name: "Товар в наличии",
    images: ["/images/in-stock.webp"],
    inStock: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    category: { slug: "accessories" },
  },
];

const Module = require("module");
const originalLoad = Module._load;
Module._load = function(request: string, parent: any, isMain: boolean) {
  if (request === "react") {
    return { ...originalLoad.apply(this, arguments), cache: (fn: Function) => fn };
  }
  if (request === "@/lib/prisma" || request.includes("/lib/prisma") || (request === "./prisma" && parent?.filename?.endsWith("/lib/queries.ts"))) {
    return {
      __esModule: true,
      default: {
        product: {
          findMany: async () => fakeProducts,
        },
      },
    };
  }
  return originalLoad.apply(this, arguments);
};

const { getProductsNintendoFirst } = require("../lib/queries") as typeof import("../lib/queries");

async function runTest() {
  const products = await getProductsNintendoFirst({}, 0, 2);

  assert.deepEqual(
    products.map((product) => product.id),
    [2, 1],
    "homepage products should list in-stock items before made-to-order items"
  );
}

runTest().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
