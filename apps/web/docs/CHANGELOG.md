# Changelog

Alle vesentlige endringer i Genwelth AI dokumenteres i denne filen.

---

## [0.3.0] - Vacation Release

### Lagt til

- Dashboard
- Coin Terminal
- Atlas Engine
- Atlas Score
- Atlas Score Breakdown
- Candlestick Chart
- RSI Chart
- MACD Chart
- Market Ticker
- Ctrl + K Search
- Watchlist
- Search Dialog

### UI Kit

- Card
- Section
- Button
- Badge
- Progress

### Arkitektur

- Modulær komponentstruktur
- Service Layer
- Dashboard Service
- Atlas Engine
- Score-beregning

### API-er

- Binance
- CoinGecko
- Fear & Greed

### Dokumentasjon

- MASTERPLAN
- PROJECT_STATUS
- ROADMAP
- CHANGELOG
- TODO
- ARCHITECTURE
- RELEASE_NOTES

---

## [0.4.0]

### Lagt til

- Live Watchlist (signal + confidence per coin, oppdateres hvert 30. sekund)
- Opportunity Card (ekte Atlas-analyse)
- Atlas Alerts (pris, 24t-endring og signal/confidence-baserte varsler)
- Forbedret Atlas Score
- Signalhistorikk

---

## [0.5.0]

### Lagt til

- Portfolio (`/portfolio`) — live urealisert P&L
- Trading Journal (`/journal`) — auto-logging fra lukkede posisjoner, manuell registrering, CSV-eksport
- Egendefinerte Watchlists (flere navngitte lister)

---

## [0.6.0]

### Lagt til

- Multi-timeframe-analyse, support/motstand, trendstyrke, volumanalyse
- Verified Track Record (`/track-record`) — 24t-utfall for hvert LONG/SHORT-signal, verifisert mot ekte Binance-priser

---

## [0.7.0]

### Lagt til

- Ekte innlogging (e-post/passord, bcryptjs + jose JWT httpOnly-cookie, ingen ekstern tjeneste)
- Portfolio/Journal/Watchlists ble bruker-eid data (`userId` per rad)
- Stripe-abonnement (Genwelth AI Pro, 199 kr/mnd, 7 dagers prøve, Checkout + Billing Portal + webhook)
- Telegram-kanal (@GenwelthAiSignals) med automatiske LONG/SHORT-signaler
- Offentlig landingsside ("/") med live Track Record-tall for anonyme besøkende

### Endret

- Migrerte database fra SQLite til Prisma Postgres (nødvendig for bruker-eid data + ekte produksjonsdeploy)

---

## [0.8.0]

### Lagt til

- Light/dark tema (CSS-variabel-drevet)
- Mobiloptimalisering (375px viewport)
- Full i18n — engelsk, norsk, spansk, portugisisk, tysk, inkludert etter hvert selve Atlas-motorens forklaringstekst (ikke bare UI-tekst)
- Prisflash- og signal-puls-animasjoner
- Tastatursnarveier (Ctrl/Cmd+K-søk, `/`, `?`)
- `/settings`-side

### Fjernet

- 8 ubrukte duplikat-komponenter (Header, Sidebar, MarketOverview, TopMovers, SignalCard, BTCDominanceCard, FearGreedCard, TradingViewWidget)
- Den gamle "Atlas Analysis"-forklaringsseksjonen på coin-siden (dupliserte den nyere motorens forklaring)
- `getMarket`/`getTopMovers`/`getRSI` og `TopMover`-typen i `lib/binance.ts` (dødt API-lag etter TopMovers-fjerningen)

---

## [1.0.0-beta]

### Lagt til

- Invitasjonskode-gated `/signup` (`BETA_INVITE_CODE`) for lukket betatest
- Flytende tilbakemeldingsknapp (`Feedback`-tabell)

### Endret

- Cachet Track Record-beregningen (5 min) og parallelliserte per-rad-etterslep i stedet for sekvensiell henting, siden den kjørte uten cache på hvert anonyme besøk til landingssiden

### Fikset

- `UserMenu.logout` manglet i oversettelsene og viste rå nøkkeltekst i stedet for "Logg ut"