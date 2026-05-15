-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'WORKER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'TESTING', 'FACE', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED', 'DELIVERED', 'RETURNED', 'NO_ANSWER', 'BUSY', 'PHONE_CLOSED');

-- CreateEnum
CREATE TYPE "ShippingType" AS ENUM ('HOME', 'STOP_DESK');

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'WORKER',
    "permissions" TEXT[],
    "baseSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confirmationPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "upsellBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "adsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "description" TEXT,
    "landingPageUrl" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "assets" JSONB,
    "offers" JSONB,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "shippingType" "ShippingType" NOT NULL DEFAULT 'HOME',
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clientName" TEXT NOT NULL,
    "clientPhone1" TEXT NOT NULL,
    "clientPhone2" TEXT,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "hasUpsell" BOOLEAN NOT NULL DEFAULT false,
    "upsellQuantity" INTEGER,
    "totalPrice" DOUBLE PRECISION,
    "adsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "confirmedById" TEXT,
    "ecotrackRef" TEXT,
    "sentToEcotrack" BOOLEAN NOT NULL DEFAULT false,
    "sentToEcotrackAt" TIMESTAMP(3),
    "ecotrackValidated" BOOLEAN NOT NULL DEFAULT false,
    "ecotrackValidatedAt" TIMESTAMP(3),
    "isPaidOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingConfig" (
    "id" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "homeCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stopDeskCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "changeCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blacklist" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "ordersCount" INTEGER NOT NULL,
    "upsellCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "websiteType" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "endpointUuid" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcotrackConfig" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "company" TEXT NOT NULL DEFAULT 'ecotrack',
    "prefix" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastStopDeskSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcotrackConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopDeskCommune" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "wilayaId" INTEGER NOT NULL,
    "codePostal" TEXT,
    "hasStopDesk" BOOLEAN NOT NULL DEFAULT false,
    "configId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StopDeskCommune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserStores" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingConfig_stateName_key" ON "ShippingConfig"("stateName");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingConfig_stateCode_key" ON "ShippingConfig"("stateCode");

-- CreateIndex
CREATE UNIQUE INDEX "Blacklist_phone_key" ON "Blacklist"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_endpointUuid_key" ON "Integration"("endpointUuid");

-- CreateIndex
CREATE UNIQUE INDEX "StopDeskCommune_configId_wilayaId_nom_key" ON "StopDeskCommune"("configId", "wilayaId", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "_UserStores_AB_unique" ON "_UserStores"("A", "B");

-- CreateIndex
CREATE INDEX "_UserStores_B_index" ON "_UserStores"("B");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcotrackConfig" ADD CONSTRAINT "EcotrackConfig_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StopDeskCommune" ADD CONSTRAINT "StopDeskCommune_configId_fkey" FOREIGN KEY ("configId") REFERENCES "EcotrackConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserStores" ADD CONSTRAINT "_UserStores_A_fkey" FOREIGN KEY ("A") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserStores" ADD CONSTRAINT "_UserStores_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
