import { getLocale, getTranslations } from "next-intl/server";

import Section from "@/components/ui/Section";

type KeyLevelsCardProps = {
  support: number | null;
  resistance: number | null;
  poc: number | null;
  vwap: number | null;
  bullishOrderBlock: number | null;
  bearishOrderBlock: number | null;
  bullishFvg: number | null;
  bearishFvg: number | null;
  goldenPocketLow: number | null;
  goldenPocketHigh: number | null;
};

function formatPrice(
  value: number,
  locale: string
): string {
  return value.toLocaleString(locale, {
    maximumFractionDigits: value >= 1 ? 2 : 6,
  });
}

export default async function KeyLevelsCard(
  props: KeyLevelsCardProps
) {
  const t = await getTranslations("KeyLevels");
  const locale = await getLocale();

  const tone = {
    up: "text-emerald-400",
    down: "text-red-400",
    neutral: "text-white",
    accent: "text-amber-300",
  };

  const levels: Array<{
    label: string;
    value: string;
    tone: string;
  }> = [];

  const add = (
    value: number | null,
    label: string,
    color: string
  ) => {
    if (value !== null && Number.isFinite(value)) {
      levels.push({
        label,
        value: formatPrice(value, locale),
        tone: color,
      });
    }
  };

  add(props.resistance, t("resistance"), tone.down);
  add(props.support, t("support"), tone.up);
  add(props.poc, t("poc"), tone.neutral);
  add(props.vwap, t("vwap"), tone.neutral);
  add(
    props.bullishOrderBlock,
    t("bullishOrderBlock"),
    tone.up
  );
  add(
    props.bearishOrderBlock,
    t("bearishOrderBlock"),
    tone.down
  );
  add(props.bullishFvg, t("bullishFvg"), tone.up);
  add(props.bearishFvg, t("bearishFvg"), tone.down);

  if (
    props.goldenPocketLow !== null &&
    props.goldenPocketHigh !== null
  ) {
    levels.push({
      label: t("goldenPocket"),
      value: `${formatPrice(
        props.goldenPocketLow,
        locale
      )} – ${formatPrice(
        props.goldenPocketHigh,
        locale
      )}`,
      tone: tone.accent,
    });
  }

  if (levels.length === 0) {
    return null;
  }

  return (
    <Section title={t("title")} subtitle={t("subtitle")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {levels.map((level) => (
          <div
            key={level.label}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {level.label}
            </p>

            <p
              className={`mt-1 font-semibold tabular-nums ${level.tone}`}
            >
              {level.value}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
