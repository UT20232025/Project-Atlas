# Genwelth AI – Project Status

## Nåværende versjon

v0.7 — fullført (v0.4, v0.5 og v0.6 er også fullført, se docs/ROADMAP.md). v0.8 (brukeropplevelse) er delvis i gang — light/dark-tema er ferdig, mobiloptimalisering/animasjoner/ytelse gjenstår.

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

## Abonnement (Stripe)

- Genwelth AI Pro (`/pricing`) — 199 kr/måned, 7 dagers gratis prøveperiode, Stripe Checkout (hostet side, ingen kortdata i egen kode)
- Låser opp Track Record, Portfolio, Trading Journal og Watchlists; Dashboard og live Atlas-scanner forblir gratis
- Stripe-webhook (`/api/stripe/webhook`) holder abonnementsstatus oppdatert (fornyelse, kansellering); i tillegg synkroniseres status umiddelbart ved retur fra Checkout så brukeren ikke venter på webhook
- "Administrer abonnement" åpner Stripes hostede Billing Portal — ingen egenbygget kanselling/kortoppdatering-UI

## Distribusjon (Telegram)

- Offentlig Telegram-kanal (@GenwelthAiSignals) poster automatisk når Atlas gir et LONG/SHORT-signal med høy confidence (terskel 70%, konfigurerbar)
- WAIT-signaler og lav-confidence-signaler filtreres bort for å unngå spam — gjenbruker den eksisterende signalendring-deteksjonen i `recordSignalIfChanged`, ikke en egen sjekk
- Formålet er å demonstrere ekte, verifiserbare signaler for folk utenfor appen og drive dem til å registrere seg

## Landingsside

- "/" viser en offentlig markedsføringsside for besøkende uten innlogging (live Track Record-tall, funksjonsoversikt, prisoversikt, lenke til Telegram-kanalen), og den vanlige dashbordet for innloggede brukere — samme URL, ingen egen "/dashboard"-rute
- `proxy.ts` slipper "/" gjennom uten omdirigering; alle andre sider er fortsatt beskyttet som før

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
- Input
- ThemeToggle (light/dark, persistert i localStorage, ingen flash ved lasting)

---

## API-er

- Binance
- CoinGecko
- Fear & Greed

---

# Neste prioriteringer

1. v0.8 Brukeropplevelse — mobiloptimalisering og animasjoner gjenstår (tema er ferdig)
2. Bytte Stripe fra test-nøkler til live-nøkler når appen er klar for reelle abonnenter

Alle 4 pilarer i abonnements-strategien (Track Record, Stripe, Telegram, Landingsside) er nå fullført.

---

# Teknisk status

✅ TypeScript

✅ Build

✅ GitHub

✅ Modulær struktur

Prosjektet er stabilt og klart for videre utvikling.