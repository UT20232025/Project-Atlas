"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { calculatePositionSize } from "@/lib/trading/positionSize";

type PositionSizeCalculatorProps = {
  entry: number;
  stopLoss: number;
  takeProfit: number | null;
  symbol: string;
};

const ACCOUNT_KEY = "genwelth-calc-account";
const RISK_KEY = "genwelth-calc-risk";

export default function PositionSizeCalculator({
  entry,
  stopLoss,
  takeProfit,
  symbol,
}: PositionSizeCalculatorProps) {
  const t = useTranslations("PositionSize");
  const locale = useLocale();

  const [account, setAccount] = useState("1000");
  const [risk, setRisk] = useState("1");

  useEffect(() => {
    const savedAccount =
      window.localStorage.getItem(ACCOUNT_KEY);
    const savedRisk =
      window.localStorage.getItem(RISK_KEY);

    if (savedAccount) setAccount(savedAccount);
    if (savedRisk) setRisk(savedRisk);
  }, []);

  const onAccount = (value: string) => {
    setAccount(value);
    window.localStorage.setItem(ACCOUNT_KEY, value);
  };

  const onRisk = (value: string) => {
    setRisk(value);
    window.localStorage.setItem(RISK_KEY, value);
  };

  const result = calculatePositionSize({
    accountSize: Number(account),
    riskPercent: Number(risk),
    entry,
    stopLoss,
    takeProfit: takeProfit ?? undefined,
  });

  const fmt = (value: number, decimals = 2) =>
    value.toLocaleString(locale, {
      maximumFractionDigits: decimals,
    });

  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-white tabular-nums focus:border-blue-500/60 focus:outline-none";

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {t("eyebrow")}
      </p>

      <h2 className="mt-2 text-xl font-bold tracking-tight">
        {t("heading")}
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-zinc-400">
          {t("accountLabel")}
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={account}
            onChange={(event) =>
              onAccount(event.target.value)
            }
            className={inputClass}
          />
        </label>

        <label className="block text-sm text-zinc-400">
          {t("riskLabel")}
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={risk}
            onChange={(event) =>
              onRisk(event.target.value)
            }
            className={inputClass}
          />
        </label>
      </div>

      {result ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {t("dollarRisk")}
            </p>
            <p className="mt-1 font-semibold tabular-nums text-red-400">
              ${fmt(result.dollarRisk)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {t("positionSize")}
            </p>
            <p className="mt-1 font-semibold tabular-nums text-white">
              {fmt(result.positionSize, 6)} {symbol}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {t("positionValue")}
            </p>
            <p className="mt-1 font-semibold tabular-nums text-white">
              ${fmt(result.positionValue)}
            </p>
          </div>

          {result.reward !== null && (
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t("reward")}
              </p>
              <p className="mt-1 font-semibold tabular-nums text-emerald-400">
                ${fmt(result.reward)}
              </p>
            </div>
          )}

          {result.rMultiple !== null && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t("rMultiple")}
              </p>
              <p className="mt-1 font-semibold tabular-nums text-white">
                {fmt(result.rMultiple)}R
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-5 text-sm text-zinc-500">
          {t("invalid")}
        </p>
      )}

      <p className="mt-3 text-xs leading-5 text-zinc-600">
        {t("note")}
      </p>
    </section>
  );
}
