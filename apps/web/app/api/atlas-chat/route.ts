import { NextResponse } from "next/server";

import {
  isAtlasChatConfigured,
  runAtlasChat,
  type AtlasChatMessage,
} from "@/lib/atlas/atlasChat";
import { consumeChatQuota } from "@/lib/atlas/chatRateLimit";
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

  // Cost guard: cap paid model calls per user per day.
  const quota = consumeChatQuota(session.userId);

  if (!quota.allowed) {
    return NextResponse.json({
      reply: null,
      symbol: null,
      limited: true,
    });
  }

  try {
    const result = await runAtlasChat(history, message.slice(0, 2000));

    // Usage log — visible via `prisma-cli app logs` for cost monitoring.
    console.log(
      `[atlas-chat] user=${session.email} symbol=${
        result.symbol ?? "none"
      } in=${result.usage.inputTokens} out=${
        result.usage.outputTokens
      } remaining_today=${quota.remaining}`
    );

    return NextResponse.json({
      reply: result.reply,
      symbol: result.symbol,
      limited: false,
    });
  } catch (error) {
    console.error("Atlas chat failed:", error);

    return NextResponse.json(
      { error: "Atlas chat failed." },
      { status: 500 }
    );
  }
}
