import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { getCachedAtlasAnalysis } from "@/lib/atlas/atlasAnalysisCache";
import { MARKET_SYMBOLS } from "@/lib/config/markets";
import { robotoBold, robotoRegular } from "@/lib/fonts/roboto";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

export const runtime = "nodejs";

function fmt(value: number | null): string {
  return value == null || !Number.isFinite(value) ? "—" : String(value);
}

const SIGNAL_COLOR: Record<string, string> = {
  LONG: "#22c55e",
  SHORT: "#ef4444",
  WAIT: "#eab308",
};

// Directional glow — tints the whole card the trade's colour so a LONG reads
// green and a SHORT reads red at a glance.
const SIGNAL_GLOW: Record<string, string> = {
  LONG: "rgba(34,197,94,0.22)",
  SHORT: "rgba(239,68,68,0.22)",
  WAIT: "rgba(234,179,8,0.12)",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase() as MarketSymbol;

  if (!(MARKET_SYMBOLS as readonly string[]).includes(symbol)) {
    return new Response("Not found", { status: 404 });
  }

  const analysis = await getCachedAtlasAnalysis(symbol);

  // Preview override (marketing/design only) — force a LONG/SHORT look with
  // sample levels so the card can be previewed off a live directional signal.
  const previewRaw = request.nextUrl.searchParams
    .get("preview")
    ?.toUpperCase();
  const preview =
    previewRaw === "LONG" || previewRaw === "SHORT" ? previewRaw : null;

  const previewPrice = analysis.indicators.ema20;
  const previewLong = preview === "LONG";
  const roundPreview = (v: number) =>
    v >= 1000
      ? Math.round(v * 100) / 100
      : v >= 1
        ? Math.round(v * 10000) / 10000
        : Math.round(v * 1000000) / 1000000;

  // Breakout override — the caller (notifyBreakout) passes real breakout levels
  // so the card renders the momentum signal instead of the (WAIT) decision.
  const boRaw = request.nextUrl.searchParams.get("bo")?.toUpperCase();
  const bo = boRaw === "LONG" || boRaw === "SHORT" ? boRaw : null;
  const numParam = (key: string): number | null => {
    const value = Number(request.nextUrl.searchParams.get(key));
    return Number.isFinite(value) ? value : null;
  };

  const d = bo
    ? {
        signal: bo,
        confidence: numParam("conf") ?? 0,
        entry: numParam("entry"),
        stopLoss: numParam("sl"),
        takeProfit: numParam("tp"),
        riskRewardRatio: numParam("rr"),
      }
    : preview
      ? {
          signal: preview,
          confidence: 82,
          entry: previewPrice != null ? roundPreview(previewPrice) : null,
          stopLoss:
            previewPrice != null
              ? roundPreview(previewPrice * (previewLong ? 0.97 : 1.03))
              : null,
          takeProfit:
            previewPrice != null
              ? roundPreview(previewPrice * (previewLong ? 1.06 : 0.94))
              : null,
          riskRewardRatio: 2.5,
        }
      : analysis.decision;

  const coin = symbol.replace(/USDT$/, "");
  const color = SIGNAL_COLOR[d.signal] ?? "#eab308";
  const glow = SIGNAL_GLOW[d.signal] ?? SIGNAL_GLOW.WAIT;

  const stat = (label: string, value: string, valueColor = "#ffffff") => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flex: 1,
      }}
    >
      <span style={{ color: "#71717a", fontSize: 26 }}>{label}</span>
      <span style={{ color: valueColor, fontSize: 40, fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0f",
          backgroundImage: `radial-gradient(900px 600px at 82% 18%, ${glow}, transparent 70%)`,
          padding: 64,
          fontFamily: "Roboto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span
              style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}
            >
              GENWELTH
            </span>
            <span
              style={{ color: "#2dd4bf", fontSize: 34, fontWeight: 700 }}
            >
              AI
            </span>
          </div>
          <span style={{ color: "#52525b", fontSize: 26 }}>
            Powered by Atlas
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <span style={{ color: "#ffffff", fontSize: 108, fontWeight: 700 }}>
            {coin}
          </span>
          <span
            style={{
              display: "flex",
              color: "#0a0a0f",
              background: color,
              fontSize: 44,
              fontWeight: 700,
              padding: "10px 30px",
              borderRadius: 18,
            }}
          >
            {d.signal}
          </span>
          <span
            style={{
              color,
              fontSize: 64,
              fontWeight: 700,
              marginLeft: "auto",
            }}
          >
            {d.confidence}%
          </span>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {stat("Entry", fmt(d.entry))}
          {stat("Stop-loss", fmt(d.stopLoss), "#f87171")}
          {stat("Take-profit", fmt(d.takeProfit), "#4ade80")}
          {stat(
            "R:R",
            d.riskRewardRatio == null
              ? "—"
              : `${d.riskRewardRatio.toFixed(2)}:1`
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#52525b", fontSize: 24 }}>
            Educational — not financial advice.
          </span>
          <span style={{ color: "#a1a1aa", fontSize: 26 }}>
            www.genwelth.com
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Roboto",
          data: robotoRegular,
          weight: 400,
          style: "normal",
        },
        {
          name: "Roboto",
          data: robotoBold,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
}
