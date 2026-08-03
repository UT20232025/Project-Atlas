"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import Select from "@/components/ui/Select";
import { setLocale } from "@/lib/i18n/actions";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "no", label: "Norsk" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "de", label: "Deutsch" },
];

type LanguageSwitcherProps = {
  locale: string;
  className?: string;
};

export default function LanguageSwitcher({
  locale,
  className,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      aria-label="Language"
      value={locale}
      disabled={isPending}
      className={className}
      onChange={(event) => {
        const next = event.target.value;

        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        });
      }}
    >
      {LANGUAGES.map((language) => (
        <option key={language.code} value={language.code}>
          {language.label}
        </option>
      ))}
    </Select>
  );
}
