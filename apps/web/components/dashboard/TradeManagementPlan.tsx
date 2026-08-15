import { getLocale, getTranslations } from "next-intl/server";
import { Flag, Lock, Rocket, Shield } from "lucide-react";

import {
  buildStopPlan,
  type StopMoveKey,
  type TradeManagementInput,
} from "@/lib/atlas/tradeManagement";

const STAGE: Record<
  StopMoveKey,
  { titleKey: string; descKey: string; icon: typeof Flag; tone: string }
> = {
  entry: {
    titleKey: "entryTitle",
    descKey: "entryDesc",
    icon: Flag,
    tone: "text-zinc-300",
  },
  breakeven: {
    titleKey: "breakevenTitle",
    descKey: "breakevenDesc",
    icon: Shield,
    tone: "text-sky-400",
  },
  lock: {
    titleKey: "lockTitle",
    descKey: "lockDesc",
    icon: Lock,
    tone: "text-cyan-400",
  },
  trail: {
    titleKey: "trailTitle",
    descKey: "trailDesc",
    icon: Rocket,
    tone: "text-emerald-400",
  },
};

function fmt(value: number | null, locale: string): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(locale, { maximumFractionDigits: 5 });
}

export default async function TradeManagementPlan({
  setup,
}: {
  setup: TradeManagementInput;
}) {
  const t = await getTranslations("TradeManagement");
  const locale = await getLocale();

  const plan = buildStopPlan(setup);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        {t("title")}
      </p>
      <p className="mt-1 text-sm text-zinc-400">{t("subtitle")}</p>

      {plan === null ? (
        <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300/90">
          {t("noSetup")}
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {plan.map((stage, index) => {
            const meta = STAGE[stage.key];
            const Icon = meta.icon;

            const params: Record<string, string> = {
              entry: fmt(setup.entry, locale),
              trigger: fmt(stage.trigger, locale),
              stop: fmt(stage.stop, locale),
            };

            return (
              <li key={stage.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 ${meta.tone}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  {index < plan.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-zinc-800" />
                  )}
                </div>

                <div className="pb-1">
                  <p className={`text-sm font-semibold ${meta.tone}`}>
                    {t(meta.titleKey)}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {t(meta.descKey, params)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
