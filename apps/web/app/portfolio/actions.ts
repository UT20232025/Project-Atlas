"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import {
  parseDirection,
  parseOptionalNote,
  parsePositiveNumber,
  parseSymbol,
} from "@/lib/trading/formData";
import { calculatePnl, type TradeDirection } from "@/lib/trading/pnl";

export async function createPosition(formData: FormData) {
  const { userId } = await requireSession();

  const symbol = parseSymbol(formData.get("symbol"));
  const direction = parseDirection(formData.get("direction"));
  const entryPrice = parsePositiveNumber(
    formData.get("entryPrice"),
    "Entry price"
  );
  const quantity = parsePositiveNumber(
    formData.get("quantity"),
    "Quantity"
  );
  const note = parseOptionalNote(formData.get("note"));

  await prisma.position.create({
    data: {
      userId,
      symbol,
      direction,
      entryPrice,
      quantity,
      note,
    },
  });

  revalidatePath("/portfolio");
}

export async function closePosition(formData: FormData) {
  const { userId } = await requireSession();

  const positionId = String(
    formData.get("positionId") ?? ""
  );

  const exitPrice = parsePositiveNumber(
    formData.get("exitPrice"),
    "Exit price"
  );

  const position = await prisma.position.findFirst({
    where: { id: positionId, userId },
  });

  if (!position) {
    throw new Error("Position not found.");
  }

  const direction = position.direction as TradeDirection;

  const { pnl, pnlPercent } = calculatePnl(
    direction,
    position.entryPrice,
    exitPrice,
    position.quantity
  );

  await prisma.$transaction([
    prisma.journalEntry.create({
      data: {
        userId,
        symbol: position.symbol,
        direction: position.direction,
        entryPrice: position.entryPrice,
        exitPrice,
        quantity: position.quantity,
        pnl,
        pnlPercent,
        note: position.note,
        openedAt: position.openedAt,
      },
    }),

    prisma.position.delete({
      where: { id: positionId },
    }),
  ]);

  revalidatePath("/portfolio");
  revalidatePath("/journal");
}

export async function deletePosition(formData: FormData) {
  const { userId } = await requireSession();

  const positionId = String(
    formData.get("positionId") ?? ""
  );

  await prisma.position.deleteMany({
    where: { id: positionId, userId },
  });

  revalidatePath("/portfolio");
}
