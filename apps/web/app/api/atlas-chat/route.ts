import { NextResponse } from "next/server";

import {
  isAtlasChatConfigured,
  prepareAtlasChat,
  streamAtlasReply,
  STOCK_NOT_CONFIGURED_REPLY,
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

  const prep = await prepareAtlasChat(
    history,
    message.slice(0, 2000),
    session.userId
  );

  // Stock recognized but market-data key missing — answer clearly, no model call.
  if (prep.kind === "stock_not_configured") {
    return NextResponse.json({
      reply: STOCK_NOT_CONFIGURED_REPLY,
      symbol: null,
      limited: false,
    });
  }

  // Stream the model's answer token-by-token to the client.
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = streamAtlasReply(prep);

        anthropicStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        const final = await anthropicStream.finalMessage();

        // Usage log — visible via `prisma-cli app logs` for cost monitoring.
        console.log(
          `[atlas-chat] user=${session.email} symbol=${
            prep.symbol ?? "none"
          } in=${final.usage.input_tokens} out=${
            final.usage.output_tokens
          } remaining_today=${quota.remaining}`
        );

        controller.close();
      } catch (error) {
        console.error("Atlas chat stream failed:", error);

        try {
          controller.enqueue(
            encoder.encode(
              "\n\n(Atlas hit a snag — please try again.)"
            )
          );
        } catch {
          // controller may already be closed
        }

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
