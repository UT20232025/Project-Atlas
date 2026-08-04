# Genwelth AI – Project Status

## Nåværende versjon

v1.0 Beta — lukket betatest er forberedt og live. v0.4–v0.8 er alle
fullført (se `docs/ROADMAP.md`).

---

# Ferdig

## Infrastruktur

- Next.js 16, TypeScript, Tailwind CSS 4, App Router
- Prisma 7 (`@prisma/adapter-pg`) på **Prisma Postgres** (migrert fra SQLite
  i forbindelse med v0.7, da data ble bruker-eid og appen fikk et ekte
  produksjonsdeploy)
- Deployet på Prisma Compute med egendomenet www.genwelth.com

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

- Atlas Engine (trend, RSI, MACD, volum, liquidity, market structure, order blocks, fair value gaps, multi-timeframe, whale activity, risk engine, trade setup, AI decision engine)
- Dashboard Service
- Score-beregning
- Opportunity Card (ekte Atlas-analyse)
- Atlas Alerts (pris, 24t-endring og signal/confidence-baserte varsler)
- Live Watchlist (signal + confidence per coin, oppdateres hvert 30. sekund)

---

## Kvalitet

- Vitest med dekning av kjernelogikken (atlasEngine, orderBlockEngine, fairValueGapEngine, aiDecisionEngine, liquidityEngine, marketStructureEngine, trendEngine — 20 tester)
- Full i18n-verifisering (nøkkel-paritet på tvers av alle 5 språkfiler, sjekket programmatisk ved hver oversettelsesendring)

---

## Trading

- Portfolio (`/portfolio`) — live urealisert P&L, låst til innlogget bruker
- Trading Journal (`/journal`) — lukkede posisjoner logges automatisk, manuell registrering, CSV-eksport, låst til innlogget bruker
- Signalhistorikk — signalendringer logges automatisk (kun ved endring, ikke hver poll), vist per coin og som markedsbred feed på forsiden (delt data, ikke bruker-spesifikk)
- Egendefinerte Watchlists — flere navngitte lister, låst til innlogget bruker
- Track Record (`/track-record`) — verifisert 24t-utfall for hvert LONG/SHORT Atlas-signal (entry-pris lagres ved signalet, exit-pris hentes 24t senere fra Binance); cachet 5 minutter siden beregningen skanner hele signalhistorikken

---

## Autentisering

- Ekte innlogging (`/login`, `/signup`) — e-post/passord med bcryptjs-hashing og signert JWT i httpOnly-cookie (jose), ingen ekstern tjeneste
- `proxy.ts` beskytter alle sider unntatt `/`, `/login`, `/signup`
- Portfolio, Trading Journal og Watchlists er bruker-eide (egen `userId` per rad); Signalhistorikk og Track Record forblir delt markedsdata
- Første konto som registreres arver automatisk alt eksisterende data fra før innlogging fantes

## Abonnement (Stripe)

- Genwelth AI Pro (`/pricing`) — 199 kr/måned, 7 dagers gratis prøveperiode, Stripe Checkout (hostet side, ingen kortdata i egen kode)
- Låser opp Track Record, Portfolio, Trading Journal og Watchlists; Dashboard og live Atlas-scanner forblir gratis
- Stripe-webhook (`/api/stripe/webhook`) holder abonnementsstatus oppdatert; status synkroniseres også umiddelbart ved retur fra Checkout
- "Administrer abonnement" åpner Stripes hostede Billing Portal
- Kjører nå på **live Stripe-nøkler** — ekte betalende abonnenter kan registrere seg

## Distribusjon (Telegram)

- Offentlig Telegram-kanal (@GenwelthAiSignals) poster automatisk når Atlas gir et LONG/SHORT-signal med høy confidence (terskel 70%, konfigurerbar)
- WAIT-signaler og lav-confidence-signaler filtreres bort for å unngå spam

## Landingsside

- "/" viser en offentlig markedsføringsside for besøkende uten innlogging (live Track Record-tall, funksjonsoversikt, prisoversikt, lenke til Telegram-kanalen), og det vanlige dashbordet for innloggede brukere — samme URL, ingen egen "/dashboard"-rute

## Flerspråklighet (i18n)

- Engelsk, norsk, spansk, portugisisk, tysk — hele appen, inkludert selve Atlas-motorens AI-genererte forklaringstekst (ikke bare UI-tekst)
- ~13 delmotorer i `lib/atlas/` returnerer strukturerte "reason codes" i stedet for ferdige engelske strenger, oversatt via en delt `AtlasReasons`-namespace (209 nøkler × 5 språk)
- Én reell parallell forklaringsseksjon (den eldre "Atlas Analysis"-motoren) ble fjernet i stedet for oversatt, siden den dupliserte den nyere motoren

## Lukket betatest

- `/signup` krever en invitasjonskode når `BETA_INVITE_CODE` er satt i miljøet
- Flytende "Tilbakemelding"-knapp lagrer fri tekst + hvilken side testeren var på

---

## Søk og navigasjon

- Ctrl/Cmd+K eller `/` åpner søk med hele markedslisten, piltaster + Enter navigerer
- `?` åpner en hjelpemodal med full snarveisliste
- Topbar-søkeknappen åpner samme dialog

---

## UI Kit

- Card, Section, Button, Badge, Progress, Input
- ThemeToggle (light/dark, persistert i localStorage, ingen flash ved lasting)
- Prisflash- og signal-puls-animasjoner (respekterer `prefers-reduced-motion`)

---

## Markedsdata

- Binance offentlige REST API (klines, ticker, siste trades) — eneste kilde, ingen API-nøkkel nødvendig
- Fear & Greed Index

---

# Neste prioriteringer

Alle punkter fra v0.4–v1.0 Beta er fullført. `docs/TODO.md` (Norwegian,
løpende oppdatert) er den autoritative kilden for hva som gjenstår —
per nå kun åpne, ikke-bindende kategorier (flere animasjoner, videre
ytelsesarbeid hvis det dukker opp reelle flaskehalser) og selve
rekrutteringen av betatestere, som er opp til produkteier.

Alle 4 pilarer i abonnements-strategien (Track Record, Stripe, Telegram, Landingsside) er fullført. Appen er deployet på Prisma Compute med egendomenet www.genwelth.com, Stripe kjører på **live-nøkler**, og lukket betatest er teknisk klar.

---

# Teknisk status

✅ TypeScript

✅ Build

✅ GitHub

✅ Modulær struktur

✅ Full i18n-dekning (inkl. Atlas-motoren)

Prosjektet er stabilt og klart for lukket betatest.
