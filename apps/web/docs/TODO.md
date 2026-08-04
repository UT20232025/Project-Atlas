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
- [x] Flere språk (engelsk/norsk/spansk/portugisisk/tysk på hele dashbordet, coin-siden, portefølje/journal/track record og pricing; refaktorerte til slutt også selve Atlas-motoren — de ~13 delmotorene (aiDecisionEngine, riskEngine, atlasEngine, trend/volume/priceAction/marketStructure/liquidity/multiTimeframe/orderBlock/fairValueGap/whale-engine, tradeSetup) returnerer nå reason-koder i stedet for engelske strenger, oversatt via ny delt "AtlasReasons"-namespace med 209 nøkler × 5 språk; fjernet også den gamle duplikate "Atlas Analysis"-seksjonen på coin-siden som samme jobb avdekket)
- [~] Flere animasjoner (prisflash grønt/rødt ved endring i Watchlist/Portfolio, signal-puls når Atlas-signalet flipper i Watchlist og hoved-AI-beslutningspanelet — begge gjenbruker det eksisterende reveal/typing-cursor-mønsteret med prefers-reduced-motion-støtte)
- [x] Tastatursnarveier (Ctrl/Cmd+K eller `/` åpner søk med hele markedslisten, piltaster + Enter navigerer, `?` åpner en hjelpemodal med full snarveisliste; Topbar-søkeknappen — tidligere dekorativ — åpner nå samme dialog via et window-event; alt oversatt til alle 5 språk)
- [x] Innstillinger (`/settings`: konto-info, abonnementsstatus + administrer-lenke, utlogging)

---

## Teknisk gjeld

- [x] Gjennomgå komponenter for gjenbruk (fjernet 8 ubrukte duplikat-komponenter: Header, Sidebar, MarketOverview, TopMovers, SignalCard, BTCDominanceCard, FearGreedCard, TradingViewWidget; fikset stray norsk/engelsk-blanding i ScannerTable)
- [x] Optimalisere API-kall (MarketProvider/ScannerSignalsProvider begrenset til sidene som faktisk trenger dem, delt polling i stedet for duplisert)
- [x] Forbedre feilhåndtering (Postgres-pool gjenoppretter seg selv etter inaktivitet i stedet for å krasje siden)
- [~] Redusere unødvendige re-renders (målte faktisk ytelse i stedet for å gjette: produksjon svarer konsekvent under 1,2s på det tyngste endepunktet — /api/atlas/scanner, 20 mynter × 3 tidsrammer; de ekstreme responstidene jeg først så var kun et Turbopack/next-dev-artefakt, ikke et produksjonsproblem. Justerte likevel cache-TTL fra 25s til 35s og la til 10s timeout på Binance-kall som forsvarsmessig forbedring)
- [x] Flere enhetstester (Vitest: atlasEngine, orderBlockEngine, fairValueGapEngine, aiDecisionEngine, liquidityEngine, marketStructureEngine, trendEngine — 20 tester totalt)

---

## Før v1.0

- [x] Full mobiloptimalisering
- [x] Ytelsesoptimalisering (bundle-størrelse sjekket — kun 1,1MB totalt på tvers av alle ruter, ikke et problem; ingen N+1-spørringsmønstre funnet bortsett fra ett: `getTrackRecord()` skannet hele signal-historikken og gjorde sekvensielle Binance-kall + DB-skrivinger per rad på den offentlige landingssiden ved hvert anonyme besøk — lagt til en 5-minutters cache og parallellisert etterslepet på tvers av rader, verifisert byte-for-byte identisk resultat mot den gamle sekvensielle versjonen; fjernet også `getMarket`/`getTopMovers`/`getRSI`/`TopMover`-typen som var blitt død kode etter en tidligere komponentopprydning)
- [x] Lukket betatest (forberedt teknisk: `/signup` krever nå en invitasjonskode når `BETA_INVITE_CODE` er satt i miljøet — allerede satt i produksjon, se Prisma Console → Project env vars for verdien; en flytende "Tilbakemelding"-knapp er lagt til i AppLayout som lagrer fri tekst + hvilken side testeren var på, i en ny `Feedback`-tabell. Selve rekrutteringen av testere er opp til deg)
- [x] Feilretting (QA-runde gjennom dashboard, coin-side, Portfolio/Journal/Watchlist/Track Record med en midlertidig Pro-konto, Pricing, mobilvisning; fant og fikset `UserMenu.logout` som manglet i oversettelsene og viste rå nøkkeltekst; en periodisk P1017/`ConnectionClosed`-feil fra Postgres-poolen dukket opp under testing men ble bekreftet forbigående — retry løser den umiddelbart, og produksjon svarte 10/10 på gjentatte forespørsler, så ingen kodeendring var nødvendig der)
- [x] Endelig dokumentasjon (README.md var fortsatt create-next-app-boilerplaten — full omskriving; ARCHITECTURE.md var like generisk scaffolding — skrevet på nytt til å faktisk beskrive auth, Atlas-motoren + reason-code-i18n, Prisma Postgres, Stripe, Telegram; RELEASE_NOTES.md var ved en feil en duplikat av den gamle ARCHITECTURE.md — nå ekte versjonsnotater; PROJECT_STATUS.md og CHANGELOG.md var utdaterte siden v0.3/tidlig — oppdatert til å stemme med faktisk tilstand; ROADMAP.md fikk v0.8/v1.0 Beta markert ferdig; ryddet også en tomt feilplassert mappe fra et gammelt shell-uhell)