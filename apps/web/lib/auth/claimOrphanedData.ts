import { prisma } from "@/lib/db/client";

export async function claimOrphanedDataForFirstUser(
  userId: string
): Promise<void> {
  const existingUserCount = await prisma.user.count();

  if (existingUserCount !== 1) {
    return;
  }

  await Promise.all([
    prisma.position.updateMany({
      where: { userId: null },
      data: { userId },
    }),
    prisma.journalEntry.updateMany({
      where: { userId: null },
      data: { userId },
    }),
    prisma.watchlist.updateMany({
      where: { userId: null },
      data: { userId },
    }),
  ]);
}
