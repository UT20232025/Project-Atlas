"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

function Shortcut({
  keys,
  label,
}: {
  keys: string[];
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-zinc-300">
        {label}
      </span>

      <span className="flex items-center gap-1">
        {keys.map((key) => (
          <kbd
            key={key}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-300"
          >
            {key}
          </kbd>
        ))}
      </span>
    </div>
  );
}

export default function ShortcutsHelp() {
  const t = useTranslations("ShortcutsHelp");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "?" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="atlas-card w-full max-w-sm rounded-2xl p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white">
          {t("title")}
        </h2>

        <div className="mt-3 divide-y divide-zinc-800">
          <Shortcut
            keys={["Ctrl", "K"]}
            label={t("openSearch")}
          />
          <Shortcut
            keys={["/"]}
            label={t("openSearch")}
          />
          <Shortcut
            keys={["↑", "↓"]}
            label={t("navigateResults")}
          />
          <Shortcut
            keys={["Enter"]}
            label={t("selectResult")}
          />
          <Shortcut
            keys={["Esc"]}
            label={t("closeDialog")}
          />
          <Shortcut
            keys={["?"]}
            label={t("showShortcuts")}
          />
        </div>

        <p className="mt-4 text-xs text-zinc-600">
          {t("closeHint")}
        </p>
      </div>
    </div>
  );
}
