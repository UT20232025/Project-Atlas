# Genwelth AI – Project Status

## Nåværende versjon

v0.5 — fullført (v0.4 og v0.6 er også fullført, se docs/ROADMAP.md). Neste versjon (v0.7) er brukeropplevelse (mobiloptimalisering, temaer, animasjoner) — ingen konkret plan enda.

---

# Ferdig

## Infrastruktur

- Next.js 16
- TypeScript
- Tailwind CSS
- App Router

---

## Layout

- AppLayout
- Sidebar
- Topbar

---

## Dashboard

- Dashboard-side
- Market Ticker
- Watchlist
- Atlas Score
- Atlas Score Breakdown

---

## Coin Terminal

- Candlestick Chart
- RSI Chart
- MACD Chart
- Atlas Explain
- Coin-side

---

## Analyse

- Atlas Engine (trend, RSI, MACD, volum, liquidity, market structure, order blocks, fair value gaps, multi-timeframe, AI decision engine)
- Dashboard Service
- Score-beregning
- Opportunity Card (ekte Atlas-analyse)
- Atlas Alerts (pris, 24t-endring og signal/confidence-baserte varsler)
- Live Watchlist (signal + confidence per coin, oppdateres hvert 30. sekund)

---

## Kvalitet

- Vitest satt opp med innledende dekning av kjernelogikken (atlasEngine, orderBlockEngine, fairValueGapEngine, aiDecisionEngine)

---

## Trading

- Portfolio (`/portfolio`) — SQLite-database via Prisma, live urealisert P&L
- Trading Journal (`/journal`) — lukkede posisjoner logges automatisk, manuell registrering, CSV-eksport
- Signalhistorikk — signalendringer logges automatisk (kun ved endring, ikke hver poll), vist per coin og som markedsbred feed på forsiden
- Egendefinerte Watchlists — flere navngitte lister (SQLite via Prisma), erstatter den gamle enkle favoritt-listen; eksisterende favoritter migreres automatisk første gang

---

## Søk

- Ctrl + K Search
- Search Dialog

---

## UI Kit

- Card
- Section
- Button
- Badge
- Progress

---

## API-er

- Binance
- CoinGecko
- Fear & Greed

---

# Neste prioriteringer

1. v0.7 Brukeropplevelse (mobiloptimalisering, temaer, animasjoner) — ingen konkret plan enda
2. Ekte autentisering (kun når flerbrukerstøtte faktisk trengs — Portfolio/Journal/Signalhistorikk/Watchlists er i dag én delt database uten innlogging)

---

# Teknisk status

✅ TypeScript

✅ Build

✅ GitHub

✅ Modulær struktur

Prosjektet er stabilt og klart for videre utvikling.