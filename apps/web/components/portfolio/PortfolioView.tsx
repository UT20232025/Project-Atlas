"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  PieChart,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { usePriceFlash } from "@/components/hooks/usePriceFlash";
import { useMarket } from "@/components/providers/MarketProvider";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import {
  formatMarketSymbol,
  MARKET_SYMBOLS,
} from "@/lib/services/liveMarketService";
import {
  calculatePnl,
  type PortfolioPositionView,
} from "@/lib/trading/pnl";

type AtlasSignal = "LONG" | "SHORT" | "WAIT";

type PortfolioViewProps = {
  positions: PortfolioPositionView[];
  atlasSignals: Record<string, AtlasSignal>;
  createPositionAction: (formData: FormData) => void;
  closePositionAction: (formData: FormData) => void;
  deletePositionAction: (formData: FormData) => void;
};

function usd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function signedPct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  subTone?: string;
  icon: typeof Briefcase;
};

function StatCard({
  label,
  value,
  sub,
  subTone = "text-zinc-500",
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="atlas-subcard rounded-2xl p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <Icon
          className="h-5 w-5 shrink-0 text-cyan-400/70"
          strokeWidth={1.75}
        />
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">
        {value}
      </p>
      {sub && (
        <p className={`mt-1 text-xs font-medium ${subTone}`}>{sub}</p>
      )}
    </div>
  );
}

type PortfolioPositionRowProps = {
  position: PortfolioPositionView;
  atlasSignal: AtlasSignal | undefined;
  currentPrice: number | undefined;
  isClosing: boolean;
  onToggleClosing: () => void;
  closePositionAction: (formData: FormData) => void;
  deletePositionAction: (formData: FormData) => void;
  t: ReturnType<typeof useTranslations>;
};

function PortfolioPositionRow({
  position,
  atlasSignal,
  currentPrice,
  isClosing,
  onToggleClosing,
  closePositionAction,
  deletePositionAction,
  t,
}: PortfolioPositionRowProps) {
  const priceFlash = usePriceFlash(currentPrice ?? 0);

  // Compare Atlas's current read with the direction the user is holding, so a
  // position that's gone against the engine surfaces immediately.
  const alignment =
    atlasSignal === undefined || atlasSignal === "WAIT"
      ? { variant: "yellow" as const, label: t("atlasNeutral") }
      : atlasSignal === position.direction
        ? { variant: "green" as const, label: t("atlasAgree") }
        : { variant: "red" as const, label: t("atlasDisagree") };

  const unrealized =
    currentPrice !== undefined
      ? calculatePnl(
          position.direction,
          position.entryPrice,
          currentPrice,
          position.quantity
        )
      : null;

  return (
    <div className="atlas-subcard rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="font-semibold text-white">
            {formatMarketSymbol(position.symbol)}
          </p>

          <Badge
            variant={
              position.direction === "LONG" ? "green" : "red"
            }
          >
            {position.direction}
          </Badge>

          <Badge variant={alignment.variant}>
            {alignment.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleClosing}
            className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:text-white"
          >
            {isClosing ? t("cancel") : t("close")}
          </button>

          <form action={deletePositionAction}>
            <input
              type="hidden"
              name="positionId"
              value={position.id}
            />

            <button
              type="submit"
              className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
            >
              {t("delete")}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-zinc-500">{t("entry")}</p>
          <p className="text-zinc-200">{position.entryPrice}</p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">{t("quantity")}</p>
          <p className="text-zinc-200">{position.quantity}</p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            {t("currentPrice")}
          </p>
          <p
            className={`text-zinc-200 ${
              priceFlash === "up"
                ? "atlas-price-flash-up"
                : priceFlash === "down"
                  ? "atlas-price-flash-down"
                  : ""
            }`}
          >
            {currentPrice ?? "—"}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            {t("unrealizedPnl")}
          </p>
          <p
            className={
              unrealized && unrealized.pnl >= 0
                ? "font-semibold text-green-400"
                : unrealized
                  ? "font-semibold text-red-400"
                  : "text-zinc-600"
            }
          >
            {unrealized
              ? `${unrealized.pnl >= 0 ? "+" : ""}${unrealized.pnl.toFixed(2)} (${unrealized.pnlPercent.toFixed(2)}%)`
              : "—"}
          </p>
        </div>
      </div>

      {position.note && (
        <p className="mt-3 text-sm text-zinc-500">{position.note}</p>
      )}

      {isClosing && (
        <form
          action={closePositionAction}
          className="atlas-subcard mt-4 flex flex-wrap items-center gap-3 rounded-xl p-3"
        >
          <input
            type="hidden"
            name="positionId"
            value={position.id}
          />

          <input
            type="number"
            name="exitPrice"
            placeholder={t("exitPricePlaceholder")}
            step="any"
            required
            defaultValue={currentPrice}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
          >
            {t("confirmClose")}
          </button>
        </form>
      )}
    </div>
  );
}

export default function PortfolioView({
  positions,
  atlasSignals,
  createPositionAction,
  closePositionAction,
  deletePositionAction,
}: PortfolioViewProps) {
  const t = useTranslations("Portfolio");
  const { market } = useMarket();
  const [closingPositionId, setClosingPositionId] = useState<
    string | null
  >(null);

  // Enrich each position with its live price once, and reuse it for both the
  // summary stats and the individual rows so live P&L stays consistent.
  const rows = positions.map((position) => {
    const currentPrice = market.find(
      (item) => item.symbol === position.symbol
    )?.price;

    const pnl =
      currentPrice !== undefined
        ? calculatePnl(
            position.direction,
            position.entryPrice,
            currentPrice,
            position.quantity
          )
        : null;

    return {
      position,
      currentPrice,
      pnl,
      marketValue: (currentPrice ?? position.entryPrice) * position.quantity,
      costBasis: position.entryPrice * position.quantity,
    };
  });

  const totalPositions = positions.length;
  const totalPnl = rows.reduce((sum, r) => sum + (r.pnl?.pnl ?? 0), 0);
  const totalCost = rows.reduce((sum, r) => sum + r.costBasis, 0);
  const pnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const portfolioValue = rows.reduce((sum, r) => sum + r.marketValue, 0);
  const winning = rows.filter((r) => r.pnl && r.pnl.pnl >= 0).length;
  const winPct = totalPositions > 0 ? (winning / totalPositions) * 100 : 0;
  const avgEntry =
    totalPositions > 0
      ? positions.reduce((sum, p) => sum + p.entryPrice, 0) / totalPositions
      : 0;

  const pnlTone = totalPnl >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          TRACK. ANALYZE.{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            GROW.
          </span>
        </h1>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-500/50 sm:w-12" />
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-cyan-300/80">
            Full control of your portfolio
          </p>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-cyan-500/50 sm:w-12" />
        </div>
      </div>

      {/* Main portfolio card */}
      <div className="atlas-card rounded-3xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>

        <form
          action={createPositionAction}
          className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1.5fr_auto]"
        >
          <Select name="symbol" defaultValue={MARKET_SYMBOLS[0]}>
            {MARKET_SYMBOLS.map((symbol) => (
              <option key={symbol} value={symbol}>
                {formatMarketSymbol(symbol)}
              </option>
            ))}
          </Select>

          <Select name="direction" defaultValue="LONG">
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </Select>

          <input
            type="number"
            name="entryPrice"
            placeholder={t("entryPricePlaceholder")}
            step="any"
            required
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <input
            type="number"
            name="quantity"
            placeholder={t("quantityPlaceholder")}
            step="any"
            required
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <input
            type="text"
            name="note"
            placeholder={t("notePlaceholder")}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
          >
            {t("addPosition")}
          </button>
        </form>

        {positions.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
            <Briefcase
              className="mx-auto h-10 w-10 text-cyan-400/60"
              strokeWidth={1.5}
            />
            <p className="mt-3 font-medium text-zinc-200">
              {t("emptyTitle")}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {t("emptyHint")}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {rows.map(({ position, currentPrice }) => {
              const isClosing = closingPositionId === position.id;

              return (
                <PortfolioPositionRow
                  key={position.id}
                  position={position}
                  atlasSignal={atlasSignals[position.symbol]}
                  currentPrice={currentPrice}
                  isClosing={isClosing}
                  onToggleClosing={() =>
                    setClosingPositionId(
                      isClosing ? null : position.id
                    )
                  }
                  closePositionAction={closePositionAction}
                  deletePositionAction={deletePositionAction}
                  t={t}
                />
              );
            })}
          </div>
        )}

        {/* Live summary stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Total positions"
            value={String(totalPositions)}
            icon={Briefcase}
          />
          <StatCard
            label="Unrealized P&L"
            value={usd(totalPnl)}
            sub={signedPct(pnlPct)}
            subTone={pnlTone}
            icon={TrendingUp}
          />
          <StatCard
            label="Portfolio value"
            value={usd(portfolioValue)}
            icon={PieChart}
          />
          <StatCard
            label="Winning positions"
            value={String(winning)}
            sub={`${winPct.toFixed(0)}%`}
            subTone="text-emerald-400"
            icon={Trophy}
          />
          <StatCard
            label="Avg entry price"
            value={usd(avgEntry)}
            icon={Target}
          />
        </div>
      </div>

      {/* Education / value section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="atlas-subcard rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-white">
            Make every trade count with{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Atlas
            </span>
            .
          </h3>
          <ul className="mt-6 space-y-3">
            {[
              "Track your entries",
              "Monitor performance",
              "Analyze results",
              "Improve over time",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-zinc-300"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="atlas-subcard rounded-3xl p-8">
          <p className="text-xs font-medium uppercase tracking-wider text-cyan-300/80">
            Why track your positions?
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Tracking your positions lets you see the big picture,
            manage risk, and identify what&apos;s working.
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Risk management",
                desc: "Control your risk exposure.",
              },
              {
                icon: BarChart3,
                title: "Performance insights",
                desc: "See what's working and what's not.",
              },
              {
                icon: Target,
                title: "Better decisions",
                desc: "Data-driven trades lead to growth.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                  <Icon
                    className="h-5 w-5 text-cyan-400"
                    strokeWidth={1.75}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">
                  {title}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer tagline */}
      <p className="pt-2 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-600">
        Built for traders. Powered by AI. Backed by data.
      </p>
    </div>
  );
}
