"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/client";
import {
  parseDirection,
  parseOptionalNote,
  parsePositiveNumber,
  parseSymbol,
} from "@/lib/trading/formData";
import { calculatePnl } from "@/lib/trading/pnl";

export async function createJournalEntry(
  formData: FormData
) {
  const symbol = parseSymbol(formData.get("symbol"));
  const direction = parseDirection(formData.get("direction"));

  const entryPrice = parsePositiveNumber(
    formData.get("entryPrice"),
    "Entry price"
  );

  const exitPrice = parsePositiveNumber(
    formData.get("exitPrice"),
    "Exit price"
  );

  const quantity = parsePositiveNumber(
    formData.get("quantity"),
    "Quantity"
  );

  const note = parseOptionalNote(formData.get("note"));

  const openedAtRaw = String(
    formData.get("openedAt") ?? ""
  );

  const openedAt = openedAtRaw
    ? new Date(openedAtRaw)
    : new Date();

  const { pnl, pnlPercent } = calculatePnl(
    direction,
    entryPrice,
    exitPrice,
    quantity
  );

  await prisma.journalEntry.create({
    data: {
      symbol,
      direction,
      entryPrice,
      exitPrice,
      quantity,
      pnl,
      pnlPercent,
      note,
      openedAt,
    },
  });

  revalidatePath("/journal");
}

export async function deleteJournalEntry(
  formData: FormData
) {
  const entryId = String(
    formData.get("entryId") ?? ""
  );

  await prisma.journalEntry.delete({
    where: { id: entryId },
  });

  revalidatePath("/journal");
}
