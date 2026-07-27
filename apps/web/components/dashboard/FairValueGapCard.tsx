import type {
  FairValueGapResult,
} from "@/lib/atlas/fairValueGapEngine";

type FairValueGapCardProps = {
  fairValueGaps: FairValueGapResult;
};

export default function FairValueGapCard({
  fairValueGaps,
}: FairValueGapCardProps) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-zinc-400">
        {fairValueGaps.summary}
      </p>

      <p className="text-emerald-400">
        Bullish:{" "}
        {fairValueGaps.bullishFairValueGaps.length}
      </p>

      <p className="text-red-400">
        Bearish:{" "}
        {fairValueGaps.bearishFairValueGaps.length}
      </p>

      <p className="text-zinc-300">
        Nearest Bullish:{" "}
        {fairValueGaps.nearestBullishFairValueGap
          ? fairValueGaps.nearestBullishFairValueGap.midpoint.toFixed(2)
          : "None"}
      </p>{fairValueGaps.nearestBullishFairValueGap && (
  <p className="text-xs text-zinc-500">
    Strength:{" "}
    {fairValueGaps.nearestBullishFairValueGap.strength}%
  </p>
)}

      <p className="text-zinc-300">
        Nearest Bearish:{" "}
        {fairValueGaps.nearestBearishFairValueGap
          ? fairValueGaps.nearestBearishFairValueGap.midpoint.toFixed(2)
          : "None"}
      </p>{fairValueGaps.nearestBearishFairValueGap && (
  <p className="text-xs text-zinc-500">
    Strength:{" "}
    {fairValueGaps.nearestBearishFairValueGap.strength}%
  </p>
)}
    </div>
  );
}