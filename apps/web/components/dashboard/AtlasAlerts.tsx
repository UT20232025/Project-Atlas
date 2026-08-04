"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useMarket } from "@/components/providers/MarketProvider";
import {
  useScannerSignals,
  type AtlasSignalData,
} from "@/components/providers/ScannerSignalsProvider";
import Section from "@/components/ui/Section";
import Select from "@/components/ui/Select";
import {
  formatMarketSymbol,
  MARKET_SYMBOLS,
  type LiveMarketItem,
  type MarketSymbol,
} from "@/lib/services/liveMarketService";

type AlertRule =
  | "price_above"
  | "price_below"
  | "change_above"
  | "change_below"
  | "signal_long"
  | "signal_short"
  | "confidence_above";

type AtlasAlert = {
  id: string;
  symbol: MarketSymbol;
  rule: AlertRule;
  target: number;
  enabled: boolean;
};

const RULES_WITHOUT_TARGET: AlertRule[] = [
  "signal_long",
  "signal_short",
];

function usesAtlasSignal(rule: AlertRule) {
  return (
    rule === "signal_long" ||
    rule === "signal_short" ||
    rule === "confidence_above"
  );
}

const STORAGE_KEY = "genwelth-atlas-alerts";

function getStoredAlerts(): AtlasAlert[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedAlerts = window.localStorage.getItem(STORAGE_KEY);

    if (!storedAlerts) {
      return [];
    }

    const parsedAlerts = JSON.parse(storedAlerts);

    return Array.isArray(parsedAlerts) ? parsedAlerts : [];
  } catch {
    return [];
  }
}

function getRuleLabel(t: ReturnType<typeof useTranslations>, rule: AlertRule) {
  if (rule === "price_above") return t("rulePriceAbove");
  if (rule === "price_below") return t("rulePriceBelow");
  if (rule === "change_above") return t("ruleChangeAbove");
  if (rule === "change_below") return t("ruleChangeBelow");
  if (rule === "signal_long") return t("ruleSignalLong");
  if (rule === "signal_short") return t("ruleSignalShort");

  return t("ruleConfidenceAbove");
}

function isAlertTriggered(
  alert: AtlasAlert,
  marketData?: LiveMarketItem,
  atlasSignal?: AtlasSignalData
) {
  if (!alert.enabled) {
    return false;
  }

  if (usesAtlasSignal(alert.rule)) {
    if (!atlasSignal) {
      return false;
    }

    if (alert.rule === "signal_long") {
      return atlasSignal.signal === "LONG";
    }

    if (alert.rule === "signal_short") {
      return atlasSignal.signal === "SHORT";
    }

    return atlasSignal.confidence >= alert.target;
  }

  if (!marketData) {
    return false;
  }

  if (alert.rule === "price_above") {
    return marketData.price >= alert.target;
  }

  if (alert.rule === "price_below") {
    return marketData.price <= alert.target;
  }

  if (alert.rule === "change_above") {
    return marketData.change24h >= alert.target;
  }

  return marketData.change24h <= alert.target;
}

export default function AtlasAlerts() {
  const t = useTranslations("AtlasAlerts");
  const { market, loading, error } = useMarket();
  const atlasSignals = useScannerSignals();

  const [alerts, setAlerts] = useState<AtlasAlert[]>([]);
  const [symbol, setSymbol] =
    useState<MarketSymbol>("BTCUSDT");
  const [rule, setRule] =
    useState<AlertRule>("price_above");
  const [target, setTarget] = useState("");

  useEffect(() => {
    setAlerts(getStoredAlerts());
  }, []);

  function saveAlerts(nextAlerts: AtlasAlert[]) {
    setAlerts(nextAlerts);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextAlerts)
    );
  }

  function createAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requiresTarget = !RULES_WITHOUT_TARGET.includes(
      rule
    );

    const numericTarget = requiresTarget
      ? Number(target)
      : 0;

    if (
      requiresTarget &&
      !Number.isFinite(numericTarget)
    ) {
      return;
    }

    const newAlert: AtlasAlert = {
      id: crypto.randomUUID(),
      symbol,
      rule,
      target: numericTarget,
      enabled: true,
    };

    saveAlerts([newAlert, ...alerts]);
    setTarget("");
  }

  function toggleAlert(id: string) {
    const nextAlerts = alerts.map((alert) =>
      alert.id === id
        ? {
            ...alert,
            enabled: !alert.enabled,
          }
        : alert
    );

    saveAlerts(nextAlerts);
  }

  function deleteAlert(id: string) {
    saveAlerts(alerts.filter((alert) => alert.id !== id));
  }

  const triggeredAlerts = useMemo(
    () =>
      alerts.filter((alert) =>
        isAlertTriggered(
          alert,
          market.find(
            (item) => item.symbol === alert.symbol
          ),
          atlasSignals[alert.symbol]
        )
      ).length,
    [alerts, market, atlasSignals]
  );

  return (
    <Section
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <form
        onSubmit={createAlert}
        className="atlas-subcard mb-6 grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_1.5fr_1fr_auto]"
      >
        <Select
          value={symbol}
          onChange={(event) =>
            setSymbol(event.target.value as MarketSymbol)
          }
        >
          {MARKET_SYMBOLS.map((marketSymbol) => (
            <option key={marketSymbol} value={marketSymbol}>
              {formatMarketSymbol(marketSymbol)}
            </option>
          ))}
        </Select>

        <Select
          value={rule}
          onChange={(event) =>
            setRule(event.target.value as AlertRule)
          }
        >
          <option value="price_above">{t("rulePriceAbove")}</option>
          <option value="price_below">{t("rulePriceBelow")}</option>
          <option value="change_above">
            {t("ruleChangeAbove")}
          </option>
          <option value="change_below">
            {t("ruleChangeBelow")}
          </option>
          <option value="signal_long">
            {t("optionSignalLong")}
          </option>
          <option value="signal_short">
            {t("optionSignalShort")}
          </option>
          <option value="confidence_above">
            {t("ruleConfidenceAbove")}
          </option>
        </Select>

        {RULES_WITHOUT_TARGET.includes(rule) ? (
          <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-600">
            {t("noTargetNeeded")}
          </div>
        ) : (
          <input
            type="number"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder={
              rule.startsWith("price")
                ? t("targetPrice")
                : rule === "confidence_above"
                ? t("targetConfidence")
                : t("targetPercent")
            }
            step="any"
            required
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />
        )}

        <button
          type="submit"
          className="rounded-xl bg-[#ffffff] px-5 py-3 text-sm font-semibold text-[#000000] transition hover:bg-[#e4e4e7]"
        >
          {t("addAlert")}
        </button>
      </form>

      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-zinc-500">
          {t("savedAlerts", { count: alerts.length })}
        </span>

        <span
          className={
            triggeredAlerts > 0
              ? "font-medium text-yellow-400"
              : "text-zinc-500"
          }
        >
          {t("triggeredCount", { count: triggeredAlerts })}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading && alerts.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 p-8 text-center text-sm text-zinc-500">
            {t("loadingAlerts")}
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="font-medium text-zinc-300">
              {t("noAlertsCreated")}
            </p>

            <p className="mt-1 text-sm text-zinc-600">
              {t("noAlertsHint")}
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const coinMarketData = market.find(
              (item) => item.symbol === alert.symbol
            );

            const triggered = isAlertTriggered(
              alert,
              coinMarketData,
              atlasSignals[alert.symbol]
            );

            const targetSuffix = alert.rule.startsWith(
              "change"
            )
              ? "%"
              : alert.rule === "confidence_above"
              ? "%"
              : " USDT";

            return (
              <div
                key={alert.id}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-xl p-4 ${
                  triggered
                    ? "border border-yellow-500/30 bg-yellow-500/10"
                    : "atlas-subcard"
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-white">
                      {formatMarketSymbol(alert.symbol)}
                    </p>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        triggered
                          ? "bg-yellow-500/15 text-yellow-300"
                          : alert.enabled
                          ? "bg-green-500/10 text-green-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {triggered
                        ? t("statusTriggered")
                        : alert.enabled
                        ? t("statusActive")
                        : t("statusPaused")}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    {getRuleLabel(t, alert.rule)}
                    {!RULES_WITHOUT_TARGET.includes(
                      alert.rule
                    ) && (
                      <>
                        {" "}
                        <span className="text-zinc-300">
                          {alert.target}
                          {targetSuffix}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAlert(alert.id)}
                    className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:text-white"
                  >
                    {alert.enabled ? t("pause") : t("activate")}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteAlert(alert.id)}
                    className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Section>
  );
}