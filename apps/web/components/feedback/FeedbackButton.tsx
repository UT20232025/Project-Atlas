"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { submitFeedback } from "@/lib/feedback/actions";

export default function FeedbackButton() {
  const t = useTranslations("Feedback");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent"
  >("idle");

  function closeDialog() {
    setOpen(false);
    setMessage("");
    setStatus("idle");
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDialog();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!message.trim() || status === "sending") {
      return;
    }

    setStatus("sending");
    const result = await submitFeedback(message, pathname);

    if (result.ok) {
      setStatus("sent");
      setMessage("");
      setTimeout(closeDialog, 1500);
    } else {
      setStatus("idle");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-300 shadow-lg transition hover:border-blue-500 hover:text-white"
      >
        {t("buttonLabel")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={closeDialog}
        >
          <div
            className="atlas-card w-full max-w-sm rounded-2xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white">
              {t("title")}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {t("subtitle")}
            </p>

            {status === "sent" ? (
              <p className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300">
                {t("thanks")}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4">
                <textarea
                  autoFocus
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  placeholder={t("placeholder")}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />

                <button
                  type="submit"
                  disabled={
                    !message.trim() || status === "sending"
                  }
                  className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "sending"
                    ? t("sending")
                    : t("submit")}
                </button>
              </form>
            )}

            <p className="mt-4 text-xs text-zinc-600">
              {t("closeHint")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
