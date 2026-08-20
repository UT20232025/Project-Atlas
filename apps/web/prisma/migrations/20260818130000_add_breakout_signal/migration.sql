-- CreateTable
CREATE TABLE "BreakoutSignal" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "strength" INTEGER NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcomePrice" DOUBLE PRECISION,
    "outcomeAt" TIMESTAMP(3),

    CONSTRAINT "BreakoutSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BreakoutSignal_symbol_createdAt_idx" ON "BreakoutSignal"("symbol", "createdAt");
