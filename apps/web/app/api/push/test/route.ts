import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { sendPushToUser } from "@/lib/push/webPush";

export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  await sendPushToUser(session.userId, {
    title: "🔔 Genwelth AI",
    body: "Test notification — push is working.",
    url: "/",
    tag: "genwelth-test",
  });

  return NextResponse.json({ ok: true });
}
