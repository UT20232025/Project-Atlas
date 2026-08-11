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
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const sub = body as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;

  if (
    typeof endpoint !== "string" ||
    typeof p256dh !== "string" ||
    typeof auth !== "string"
  ) {
    return NextResponse.json(
      { error: "Invalid subscription." },
      { status: 400 }
    );
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: session.userId, p256dh, auth },
    create: { userId: session.userId, endpoint, p256dh, auth },
  });

  return NextResponse.json({ ok: true });
}
