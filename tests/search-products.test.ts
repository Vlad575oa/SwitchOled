import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const Module = require("module");
const originalLoad = Module._load;
Module._load = function(request: string, parent: any, isMain: boolean) {
  if (request === "next/cache") {
    return { revalidatePath: () => {} };
  }
  if (request === "next/headers") {
    return { cookies: () => ({ get: () => null }) };
  }
  return originalLoad.apply(this, arguments);
};

import { searchProductsAction } from "../lib/actions";
import { getSearchQueryVariants } from "../lib/search";

const prisma = new PrismaClient();

async function runTests() {
  console.log("🧪 Starting Search Visibility Tests\n");

  const category = await prisma.category.findFirst();
  if (!category) {
    throw new Error("No category found for search visibility test");
  }

  const suffix = Date.now();
  const visibleProduct = await prisma.product.create({
    data: {
      name: `Search Visible ${suffix}`,
      slug: `search-visible-${suffix}`,
      sku: `SV-${suffix}`,
      price: 10000,
      stock: 3,
      isVisible: true,
      categoryId: category.id,
      images: ["/images/placeholder.webp"],
    },
  });

  const hiddenProduct = await prisma.product.create({
    data: {
      name: `Search Hidden ${suffix}`,
      slug: `search-hidden-${suffix}`,
      sku: `SH-${suffix}`,
      price: 10000,
      stock: 3,
      isVisible: false,
      categoryId: category.id,
      images: ["/images/placeholder.webp"],
    },
  });

  const bilingualProduct = await prisma.product.create({
    data: {
      name: `Nintendo Switch OLED ${suffix}`,
      slug: `nintendo-switch-oled-${suffix}`,
      sku: `NSO-${suffix}`,
      price: 10000,
      stock: 3,
      isVisible: true,
      categoryId: category.id,
      images: ["/images/placeholder.webp"],
    },
  });

  const liteProduct = await prisma.product.create({
    data: {
      name: `Nintendo Switch Lite ${suffix}`,
      slug: `nintendo-switch-lite-${suffix}`,
      sku: `NSL-${suffix}`,
      price: 10000,
      stock: 3,
      isVisible: true,
      categoryId: category.id,
      images: ["/images/placeholder.webp"],
    },
  });

  const storageProduct = await prisma.product.create({
    data: {
      name: `Nintendo Switch 128GB ${suffix}`,
      slug: `nintendo-switch-128gb-${suffix}`,
      sku: `NS128-${suffix}`,
      price: 10000,
      stock: 3,
      isVisible: true,
      categoryId: category.id,
      images: ["/images/placeholder.webp"],
    },
  });

  try {
    console.log("Test 1: empty search returns only visible catalog products...");
    const emptyResults = await searchProductsAction("");
    assert.ok(emptyResults.some((product) => product.id === visibleProduct.id));
    assert.ok(!emptyResults.some((product) => product.id === hiddenProduct.id));
    console.log("✅ Passed");

    console.log("Test 2: query search excludes hidden products...");
    const visibleQueryResults = await searchProductsAction(`Visible ${suffix}`);
    assert.ok(visibleQueryResults.some((product) => product.id === visibleProduct.id));

    const hiddenQueryResults = await searchProductsAction(`Hidden ${suffix}`);
    assert.ok(!hiddenQueryResults.some((product) => product.id === hiddenProduct.id));
    console.log("✅ Passed");

    console.log("Test 3: bilingual aliases map Russian and English search terms...");
    const variants = getSearchQueryVariants("нинтендо свитч олед");
    assert.ok(variants.includes("nintendo switch oled"));

    const russianQueryResults = await searchProductsAction("нинтендо свитч олед");
    assert.ok(russianQueryResults.some((product) => product.id === bilingualProduct.id));

    const englishQueryResults = await searchProductsAction("nintendo switch oled");
    assert.ok(englishQueryResults.some((product) => product.id === bilingualProduct.id));
    console.log("✅ Passed");

    console.log("Test 4: Lite consoles are found by lite and лайт...");
    const liteVariants = getSearchQueryVariants("лайт");
    assert.ok(liteVariants.includes("lite"));

    const liteEnglishResults = await searchProductsAction("lite");
    assert.ok(liteEnglishResults.some((product) => product.id === liteProduct.id));

    const liteRussianResults = await searchProductsAction("лайт");
    assert.ok(liteRussianResults.some((product) => product.id === liteProduct.id));
    console.log("✅ Passed");

    console.log("Test 5: mixed word-and-number queries match by tokens...");
    const englishNumericResults = await searchProductsAction("nintendo 128");
    assert.ok(englishNumericResults.some((product) => product.id === storageProduct.id));

    const russianNumericResults = await searchProductsAction("нинтендо 128");
    assert.ok(russianNumericResults.some((product) => product.id === storageProduct.id));
    console.log("✅ Passed");
  } finally {
    await prisma.product.deleteMany({
      where: { id: { in: [visibleProduct.id, hiddenProduct.id, bilingualProduct.id, liteProduct.id, storageProduct.id] } },
    });
    console.log("\n🧹 Test data cleaned up.");
  }

  console.log("\n🎉 Search visibility tests passed!");
}

runTests()
  .catch((e) => {
    console.error("\n❌ TEST FAILED:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
