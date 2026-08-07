"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AskAtlas() {
  const t = useTranslations("AskAtlas");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();

    if (!trimmed || loading) {
      return;
    }

    const history = messages;
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/atlas-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = (await response.json()) as {
        reply?: string | null;
        error?: string;
        limited?: boolean;
      };

      const reply = data.limited
        ? t("limitReached")
        : data.reply ??
          (response.status === 403 ? t("proRequired") : t("error"));

      setMessages([
        ...nextMessages,
        { role: "assistant", content: reply },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: t("error") },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    t("suggestion1"),
    t("suggestion2"),
    t("suggestion3"),
  ];

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[420px] flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="text-4xl">🧭</span>
            <p className="mt-3 font-medium text-zinc-200">
              {t("emptyTitle")}
            </p>
            <p className="mt-1 max-w-md text-sm text-zinc-500">
              {t("emptyBody")}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:border-blue-500 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "atlas-subcard text-zinc-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="atlas-subcard rounded-2xl px-4 py-3 text-sm text-zinc-500">
              {t("thinking")}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="mt-4 flex items-center gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("placeholder")}
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
          autoComplete="off"
        />

        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {t("send")}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-zinc-600">
        {t("disclaimer")}
      </p>
    </div>
  );
}
