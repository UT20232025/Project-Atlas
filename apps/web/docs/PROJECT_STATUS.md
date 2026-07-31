# Genwelth AI – Project Status

## Nåværende versjon

v0.7 — fullført (v0.4, v0.5 og v0.6 er også fullført, se docs/ROADMAP.md). Neste versjon (v0.8) er brukeropplevelse (mobiloptimalisering, temaer, animasjoner) — ingen konkret plan enda.

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

- Portfolio (`/portfolio`) — SQLite-database via Prisma, live urealisert P&L, låst til innlogget bruker
- Trading Journal (`/journal`) — lukkede posisjoner logges automatisk, manuell registrering, CSV-eksport, låst til innlogget bruker
- Signalhistorikk — signalendringer logges automatisk (kun ved endring, ikke hver poll), vist per coin og som markedsbred feed på forsiden (delt data, ikke bruker-spesifikk)
- Egendefinerte Watchlists — flere navngitte lister (SQLite via Prisma), erstatter den gamle enkle favoritt-listen; eksisterende favoritter migreres automatisk første gang, låst til innlogget bruker
- Track Record (`/track-record`) — verifisert 24t-utfall for hvert LONG/SHORT Atlas-signal (entry-pris lagres ved signalet, exit-pris hentes 24t senere fra Binance); eksisterende signaler backfilles automatisk med historiske priser første gang siden lastes (delt data, ikke bruker-spesifikk)

---

## Autentisering

- Ekte innlogging (`/login`, `/signup`) — e-post/passord med bcryptjs-hashing og signert JWT i httpOnly-cookie (jose), ingen ekstern tjeneste
- `proxy.ts` beskytter alle sider unntatt `/login`/`/signup` og omdirigerer til innlogging
- Portfolio, Trading Journal og Watchlists er nå bruker-eide (egen `userId` per rad); Signalhistorikk og Track Record forblir delt markedsdata
- Første konto som registreres arver automatisk alt eksisterende data fra før innlogging fantes
- Stripe-abonnement er neste steg (ikke startet — venter på at brukeren oppretter Stripe-konto)

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

1. Stripe-abonnement (auth er på plass, betaling er neste steg — venter på Stripe-konto/API-nøkler fra brukeren)
2. v0.7 Brukeropplevelse (mobiloptimalisering, temaer, animasjoner) — ingen konkret plan enda

---

# Teknisk status

✅ TypeScript

✅ Build

✅ GitHub

✅ Modulær struktur

Prosjektet er stabilt og klart for videre utvikling.