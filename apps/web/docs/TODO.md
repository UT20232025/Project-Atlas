# Genwelth AI – TODO

## Høy prioritet

- [x] Live Watchlist
- [x] Opportunity Card
- [x] Atlas Alerts (inkl. signal-baserte varsler)
- [x] Forbedre Atlas Score
- [x] Flere markedsindikatorer (liquidity, order blocks, fair value gaps, market structure, multi-timeframe)

---

## Middels prioritet

- [x] Portfolio (SQLite database via Prisma, live unrealized P&L)
- [x] Trading Journal (auto-logget fra lukkede posisjoner + manuell registrering)
- [x] Egendefinerte Watchlists (flere navngitte lister, migrert fra gamle favoritter)
- [x] Favoritt-coins (dekket av egendefinerte watchlists)
- [x] Eksporter journal til CSV
- [x] Verified Track Record (24t-utfall per LONG/SHORT-signal, automatisk backfill av historiske priser)

---

## Autentisering

- [x] Ekte innlogging (e-post/passord, bcryptjs + jose JWT httpOnly-cookie, ingen ekstern tjeneste)
- [x] Bruker-eid data for Portfolio/Journal/Watchlists (`userId` per rad, proxy.ts beskytter alle sider)
- [x] Stripe-abonnement (Genwelth AI Pro, 199 kr/mnd, 7 dagers prøve, Checkout + Billing Portal + webhook)

---

## Distribusjon

- [x] Telegram-kanal med automatiske signaler (LONG/SHORT, høy confidence, filtrert for å unngå spam)
- [x] Landingsside (offentlig "/" med live Track Record-tall for besøkende uten innlogging)

---

## Lav prioritet

- [x] Flere temaer (light/dark-bryter, `[data-theme]`-drevet CSS-variabel-omtema, ingen endring i eksisterende komponenter nødvendig)
- [x] Mobiloptimalisering (revidert på 375px viewport: ingen horisontal overflow, mobilmeny fungerer, ett tap-mål forbedret)
- [~] Flere språk (engelsk/norsk/spansk/portugisisk/tysk på hele dashbordet, coin-siden, portefølje/journal/track record og pricing; kun AI-genererte forklaringssetninger fra Atlas-motoren er fortsatt engelsk, siden det krever en refaktorering av selve motoren, ikke bare UI-tekst)
- [ ] Flere animasjoner
- [ ] Tastatursnarveier
- [x] Innstillinger (`/settings`: konto-info, abonnementsstatus + administrer-lenke, utlogging)

---

## Teknisk gjeld

- [x] Gjennomgå komponenter for gjenbruk (fjernet 8 ubrukte duplikat-komponenter: Header, Sidebar, MarketOverview, TopMovers, SignalCard, BTCDominanceCard, FearGreedCard, TradingViewWidget; fikset stray norsk/engelsk-blanding i ScannerTable)
- [x] Optimalisere API-kall (MarketProvider/ScannerSignalsProvider begrenset til sidene som faktisk trenger dem, delt polling i stedet for duplisert)
- [x] Forbedre feilhåndtering (Postgres-pool gjenoppretter seg selv etter inaktivitet i stedet for å krasje siden)
- [ ] Redusere unødvendige re-renders
- [x] Flere enhetstester (Vitest: atlasEngine, orderBlockEngine, fairValueGapEngine, aiDecisionEngine, liquidityEngine, marketStructureEngine, trendEngine — 20 tester totalt)

---

## Før v1.0

- [x] Full mobiloptimalisering
- [ ] Ytelsesoptimalisering
- [ ] Lukket betatest
- [ ] Feilretting
- [ ] Endelig dokumentasjon