-- CreateTable
CREATE TABLE "StockSnapshot" (
    "ticker" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "price" DOUBLE PRECISION,
    "checklist" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockSnapshot_pkey" PRIMARY KEY ("ticker")
);
