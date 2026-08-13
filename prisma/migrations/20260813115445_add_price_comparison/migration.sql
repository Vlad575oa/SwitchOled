-- CreateTable
CREATE TABLE "PriceSupplier" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detectPattern" JSONB NOT NULL,
    "parserKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceUpload" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "priceDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'processing',
    "rowsTotal" INTEGER NOT NULL DEFAULT 0,
    "rowsMatched" INTEGER NOT NULL DEFAULT 0,
    "rowsPending" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAlias" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "rawText" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceEntry" (
    "id" SERIAL NOT NULL,
    "uploadId" INTEGER NOT NULL,
    "gameId" INTEGER,
    "rawName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "platform" TEXT,
    "sku" TEXT,
    "priceRetail" INTEGER,
    "priceWholesale" INTEGER,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "matchStatus" TEXT NOT NULL DEFAULT 'pending',
    "matchScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceSupplier_slug_key" ON "PriceSupplier"("slug");

-- CreateIndex
CREATE INDEX "PriceUpload_supplierId_createdAt_idx" ON "PriceUpload"("supplierId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PriceUpload_supplierId_fileHash_key" ON "PriceUpload"("supplierId", "fileHash");

-- CreateIndex
CREATE INDEX "Game_platform_idx" ON "Game"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "Game_canonicalName_platform_region_key" ON "Game"("canonicalName", "platform", "region");

-- CreateIndex
CREATE UNIQUE INDEX "GameAlias_normalized_key" ON "GameAlias"("normalized");

-- CreateIndex
CREATE INDEX "GameAlias_gameId_idx" ON "GameAlias"("gameId");

-- CreateIndex
CREATE INDEX "PriceEntry_uploadId_idx" ON "PriceEntry"("uploadId");

-- CreateIndex
CREATE INDEX "PriceEntry_gameId_idx" ON "PriceEntry"("gameId");

-- CreateIndex
CREATE INDEX "PriceEntry_normalizedName_idx" ON "PriceEntry"("normalizedName");

-- CreateIndex
CREATE INDEX "PriceEntry_matchStatus_idx" ON "PriceEntry"("matchStatus");

-- AddForeignKey
ALTER TABLE "PriceUpload" ADD CONSTRAINT "PriceUpload_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "PriceSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAlias" ADD CONSTRAINT "GameAlias_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceEntry" ADD CONSTRAINT "PriceEntry_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "PriceUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceEntry" ADD CONSTRAINT "PriceEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
