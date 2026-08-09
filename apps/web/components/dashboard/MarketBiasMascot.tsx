type MarketBias = "BULLISH" | "BEARISH" | "NEUTRAL";

type MarketBiasMascotProps = {
  bias: MarketBias;
};

// Cinematic bull/bear artwork cropped from the Genwelth brand key art
// (public/mascots). Bullish shows the bull, bearish the bear, neutral the
// full face-off — the live bias badge / confidence / counts are rendered
// around this by AtlasIntelligence, so only the imagery lives here.
const CONFIG: Record<
  MarketBias,
  { src: string; fit: "cover" | "contain"; alt: string }
> = {
  BULLISH: {
    src: "/mascots/bull.png",
    fit: "contain",
    alt: "Oksemarked (bullish)",
  },
  BEARISH: {
    src: "/mascots/bear.png",
    fit: "contain",
    alt: "Bjørnemarked (bearish)",
  },
  NEUTRAL: {
    src: "/mascots/faceoff.png",
    fit: "cover",
    alt: "Okse mot bjørn (nøytralt marked)",
  },
};

const styles = `
.atlas-mascot {
  position: relative;
  width: 100%;
  height: 170px;
  margin-top: 8px;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #05070a;
}
.atlas-mascot[data-bias="BULLISH"] {
  background: radial-gradient(ellipse at center, rgba(45, 212, 191, 0.12), #060d0b 75%);
}
.atlas-mascot[data-bias="BEARISH"] {
  background: radial-gradient(ellipse at center, rgba(239, 68, 68, 0.12), #100707 75%);
}
.atlas-mascot__img {
  display: block;
  width: 100%;
  height: 100%;
  object-position: center;
}
.atlas-mascot__img--cover {
  object-fit: cover;
}
.atlas-mascot__img--contain {
  object-fit: contain;
}
`;

export default function MarketBiasMascot({
  bias,
}: MarketBiasMascotProps) {
  const config = CONFIG[bias];

  return (
    <div className="atlas-mascot" data-bias={bias}>
      <style>{styles}</style>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={config.src}
        alt={config.alt}
        className={`atlas-mascot__img atlas-mascot__img--${config.fit}`}
      />
    </div>
  );
}
