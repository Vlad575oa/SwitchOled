import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

// PROPER MOCKING FOR NEXT.JS INTERNAL MODULES
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

import { createOrderAction } from "../lib/actions";

const prisma = new PrismaClient();

async function runTests() {
  console.log("🧪 Starting Critical Path Tests: Order Flow\n");

  // 1. Setup Test Product
  const testProduct = await prisma.product.create({
    data: {
      name: "Test Product",
      slug: "test-product-" + Date.now(),
      price: 10000, // 100.00 руб
      stock: 5,
      isVisible: true,
      categoryId: (await prisma.category.findFirst())?.id || 1,
    },
  });

  try {
    // TEST 1: Successful Order
    console.log("Test 1: Successful Order Decrements Stock...");
    const res1 = await createOrderAction({
      name: "Test User",
      phone: "+79991112233",
      address: "Test Address",
      items: [{ productId: testProduct.id, quantity: 2 }],
    });

    assert.equal(res1.success, true);
    const updatedProduct1 = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert.equal(updatedProduct1?.stock, 3);
    assert.equal(updatedProduct1?.inStock, true);
    console.log("✅ Passed");

    // TEST 2: Stock Depletion (Set inStock to false)
    console.log("Test 2: Stock Depletion Marks Product as Out of Stock...");
    await createOrderAction({
      name: "Test User",
      phone: "+79991112233",
      address: "Test Address",
      items: [{ productId: testProduct.id, quantity: 3 }],
    });

    const updatedProduct2 = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert.equal(updatedProduct2?.stock, 0);
    assert.equal(updatedProduct2?.inStock, false);
    console.log("✅ Passed");

    // TEST 3: Out of Stock Failure
    console.log("Test 3: Cannot Order Out of Stock Product...");
    const res3 = await createOrderAction({
      name: "Test User",
      phone: "+79991112233",
      address: "Test Address",
      items: [{ productId: testProduct.id, quantity: 1 }],
    });
    assert.equal(res3.success, false);
    assert.match(res3.error || "", /недоступен/);
    console.log("✅ Passed");

    // TEST 4: Invalid Data (Empty items)
    console.log("Test 4: Cannot Create Order with Empty Cart...");
    const res4 = await createOrderAction({
      name: "Test User",
      phone: "+79991112233",
      address: "Test Address",
      items: [],
    });
    assert.equal(res4.success, false);
    console.log("✅ Passed");

  } finally {
    // Cleanup
    await prisma.orderItem.deleteMany({ where: { productId: testProduct.id } });
    await prisma.product.delete({ where: { id: testProduct.id } });
    console.log("\n🧹 Test data cleaned up.");
  }

  console.log("\n🎉 All critical path tests passed!");
}

// Simple mock for revalidatePath if run via tsx directly
if (!(global as any).jest) {
  (global as any).revalidatePath = () => {};
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
