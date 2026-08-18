-- CreateTable
CREATE TABLE "SignalAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "lastSignal" TEXT NOT NULL DEFAULT 'WAIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignalAlert_userId_symbol_key" ON "SignalAlert"("userId", "symbol");

-- CreateIndex
CREATE INDEX "SignalAlert_symbol_idx" ON "SignalAlert"("symbol");
