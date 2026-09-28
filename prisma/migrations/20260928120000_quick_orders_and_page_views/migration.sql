ALTER TABLE "Order" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'checkout';

CREATE TABLE "PageView" (
    "id" SERIAL NOT NULL,
    "pageType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "productId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PageView_pageType_createdAt_idx" ON "PageView"("pageType", "createdAt");
CREATE INDEX "PageView_productId_createdAt_idx" ON "PageView"("productId", "createdAt");
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
