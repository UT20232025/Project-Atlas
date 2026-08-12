"use client";

import { useState } from "react";

type ShareSignalButtonProps = {
  path: string;
  title: string;
  label: string;
  copiedLabel: string;
  className?: string;
};

/**
 * One-tap share of the public signal page. Uses the Web Share API on mobile
 * (so the recipient gets the rich link preview), and falls back to copying the
 * link on desktop.
 */
export default function ShareSignalButton({
  path,
  title,
  label,
  copiedLabel,
  className,
}: ShareSignalButtonProps) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url =
      typeof window !== "undefined"
        ? new URL(path, window.location.origin).toString()
        : path;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
      } catch {
        // user cancelled — do nothing
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.open(url, "_blank");
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={
        className ??
        "rounded-lg border border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:border-blue-500 hover:text-white"
      }
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
