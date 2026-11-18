-- Changes that were applied with db push in the original project but never captured as a migration
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "comment" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "colorHex" TEXT;

-- CreateTable
CREATE TABLE "CartEvent" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Color" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartEvent_createdAt_idx" ON "CartEvent"("createdAt");

-- CreateIndex
CREATE INDEX "CartEvent_productId_idx" ON "CartEvent"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Color_name_key" ON "Color"("name");

