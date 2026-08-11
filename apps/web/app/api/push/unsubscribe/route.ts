import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const endpoint = (body as { endpoint?: unknown })?.endpoint;

  if (typeof endpoint === "string") {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.userId },
    });
  }

  return NextResponse.json({ ok: true });
}
