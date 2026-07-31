-- CreateTable
CREATE TABLE "SignalSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SignalSnapshot_symbol_interval_createdAt_idx" ON "SignalSnapshot"("symbol", "interval", "createdAt");
