"use client";

import { FormEvent, useMemo, useState } from "react";

import { useMarket } from "@/components/providers/MarketProvider";
import Section from "@/components/ui/Section";
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
  | "change_below";

type AtlasAlert = {
  id: string;
  symbol: MarketSymbol;
  rule: AlertRule;
  target: number;
  enabled: boolean;
};

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

function getRuleLabel(rule: AlertRule) {
  if (rule === "price_above") return "Price above";
  if (rule === "price_below") return "Price below";
  if (rule === "change_above") return "24h change above";

  return "24h change below";
}

function isAlertTriggered(
  alert: AtlasAlert,
  marketData?: LiveMarketItem
) {
  if (!marketData || !alert.enabled) {
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
  const { market, loading, error } = useMarket();

  const [alerts, setAlerts] = useState<AtlasAlert[]>(
    getStoredAlerts
  );
  const [symbol, setSymbol] =
    useState<MarketSymbol>("BTCUSDT");
  const [rule, setRule] =
    useState<AlertRule>("price_above");
  const [target, setTarget] = useState("");

  function saveAlerts(nextAlerts: AtlasAlert[]) {
    setAlerts(nextAlerts);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextAlerts)
    );
  }

  function createAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericTarget = Number(target);

    if (!Number.isFinite(numericTarget)) {
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
          )
        )
      ).length,
    [alerts, market]
  );

  return (
    <Section
      title="Atlas Alerts"
      subtitle="Create price and market movement alerts"
    >
      <form
        onSubmit={createAlert}
        className="mb-6 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 md:grid-cols-[1fr_1.5fr_1fr_auto]"
      >
        <select
          value={symbol}
          onChange={(event) =>
            setSymbol(event.target.value as MarketSymbol)
          }
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-zinc-600"
        >
          {MARKET_SYMBOLS.map((marketSymbol) => (
            <option key={marketSymbol} value={marketSymbol}>
              {formatMarketSymbol(marketSymbol)}
            </option>
          ))}
        </select>

        <select
          value={rule}
          onChange={(event) =>
            setRule(event.target.value as AlertRule)
          }
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-zinc-600"
        >
          <option value="price_above">Price above</option>
          <option value="price_below">Price below</option>
          <option value="change_above">
            24h change above
          </option>
          <option value="change_below">
            24h change below
          </option>
        </select>

        <input
          type="number"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          placeholder={
            rule.startsWith("price")
              ? "Target price"
              : "Target %"
          }
          step="any"
          required
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
        />

        <button
          type="submit"
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Add alert
        </button>
      </form>

      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-zinc-500">
          {alerts.length} saved alerts
        </span>

        <span
          className={
            triggeredAlerts > 0
              ? "font-medium text-yellow-400"
              : "text-zinc-500"
          }
        >
          {triggeredAlerts} triggered
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
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="font-medium text-zinc-300">
              No alerts created
            </p>

            <p className="mt-1 text-sm text-zinc-600">
              Create your first Atlas market alert above.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const coinMarketData = market.find(
              (item) => item.symbol === alert.symbol
            );

            const triggered = isAlertTriggered(
              alert,
              coinMarketData
            );

            const targetSuffix = alert.rule.startsWith("change")
              ? "%"
              : " USDT";

            return (
              <div
                key={alert.id}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 ${
                  triggered
                    ? "border-yellow-500/30 bg-yellow-500/10"
                    : "border-zinc-800 bg-zinc-950/30"
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
                        ? "TRIGGERED"
                        : alert.enabled
                        ? "ACTIVE"
                        : "PAUSED"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    {getRuleLabel(alert.rule)}{" "}
                    <span className="text-zinc-300">
                      {alert.target}
                      {targetSuffix}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAlert(alert.id)}
                    className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:text-white"
                  >
                    {alert.enabled ? "Pause" : "Activate"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteAlert(alert.id)}
                    className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
                  >
                    Delete
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