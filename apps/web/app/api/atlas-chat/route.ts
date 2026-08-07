import { NextResponse } from "next/server";

import {
  isAtlasChatConfigured,
  runAtlasChat,
  type AtlasChatMessage,
} from "@/lib/atlas/atlasChat";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { hasActiveSubscription } from "@/lib/subscription/requirePro";

function sanitizeHistory(input: unknown): AtlasChatMessage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(
      (item): item is AtlasChatMessage =>
        !!item &&
        typeof item === "object" &&
        (item as AtlasChatMessage).role !== undefined &&
        typeof (item as AtlasChatMessage).content === "string"
    )
    .filter(
      (item) => item.role === "user" || item.role === "assistant"
    )
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 2000),
    }));
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !hasActiveSubscription(user)) {
    return NextResponse.json(
      { error: "Genwelth AI Pro required." },
      { status: 403 }
    );
  }

  if (!isAtlasChatConfigured()) {
    return NextResponse.json({
      reply:
        "Ask Atlas isn't switched on yet — the workspace still needs an Anthropic API key configured.",
      symbol: null,
    });
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

  const message = (body as { message?: unknown })?.message;

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 }
    );
  }

  const history = sanitizeHistory((body as { history?: unknown })?.history);

  try {
    const result = await runAtlasChat(history, message.slice(0, 2000));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Atlas chat failed:", error);

    return NextResponse.json(
      { error: "Atlas chat failed." },
      { status: 500 }
    );
  }
}
