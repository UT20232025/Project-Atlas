import "dotenv/config";
import pg from "pg";

// Confidence-calibration analysis: for every resolved LONG/SHORT signal that
// has a stored factor snapshot, correlate each reason/warning code with the
// realised win rate. Factors whose win rate sits well above/below the baseline
// are the predictive ones to up/down-weight in the confidence formula; factors
// near the baseline are noise. Run once enough factored signals have resolved
// (a few days after the instrumentation shipped 2026-08-16).
//
//   node scripts/factor-analysis.mjs
//
// Local .env DATABASE_URL points at prod, so this reads live data (read-only).

const MIN_COUNT = 8; // ignore factors with too few samples to trust

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const c = await pool.connect();
try {
  const { rows } = await c.query(`
    SELECT signal, price, "outcomePrice", factors
    FROM "SignalSnapshot"
    WHERE signal IN ('LONG','SHORT')
      AND price IS NOT NULL AND "outcomePrice" IS NOT NULL
      AND factors IS NOT NULL
  `);

  if (rows.length === 0) {
    console.log(
      "No resolved signals with factors yet — let the instrumentation collect for a few more days."
    );
    process.exit(0);
  }

  const pnl = (r) => {
    const raw = ((r.outcomePrice - r.price) / r.price) * 100;
    return r.signal === "SHORT" ? -raw : raw;
  };
  const isWin = (r) => pnl(r) > 0;

  const baseWins = rows.filter(isWin).length;
  const baseRate = (100 * baseWins) / rows.length;
  console.log(
    `Baseline: ${rows.length} resolved factored signals · ${baseRate.toFixed(1)}% win\n`
  );

  // Tally win rate per factor code (reasons and warnings, tagged).
  const tally = new Map(); // code -> { n, wins }
  for (const r of rows) {
    let parsed;
    try {
      parsed = JSON.parse(r.factors);
    } catch {
      continue;
    }
    const codes = [
      ...(parsed.reasons ?? []).map((x) => "R:" + x),
      ...(parsed.warnings ?? []).map((x) => "W:" + x),
    ];
    const win = isWin(r);
    for (const code of new Set(codes)) {
      const e = tally.get(code) ?? { n: 0, wins: 0 };
      e.n += 1;
      e.wins += win ? 1 : 0;
      tally.set(code, e);
    }
  }

  const ranked = [...tally.entries()]
    .filter(([, e]) => e.n >= MIN_COUNT)
    .map(([code, e]) => ({
      code,
      n: e.n,
      rate: (100 * e.wins) / e.n,
      edge: (100 * e.wins) / e.n - baseRate,
    }))
    .sort((a, b) => b.edge - a.edge);

  console.log(
    `Factors ranked by win-rate edge vs baseline (min ${MIN_COUNT} samples):\n`
  );
  console.log("  edge    win     n   factor");
  for (const f of ranked) {
    const sign = f.edge >= 0 ? "+" : "";
    console.log(
      `  ${(sign + f.edge.toFixed(1)).padStart(6)}  ${f.rate.toFixed(0).padStart(3)}%  ${String(f.n).padStart(4)}   ${f.code}`
    );
  }

  console.log(
    "\nUp-weight the top (high positive edge) factors and down-weight the bottom; factors near 0 edge are noise. Feed this back into the confidence scoring."
  );
} finally {
  c.release();
  await pool.end();
}
