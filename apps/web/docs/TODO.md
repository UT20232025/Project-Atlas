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
- [ ] Landingsside

---

## Lav prioritet

- [x] Flere temaer (light/dark-bryter, `[data-theme]`-drevet CSS-variabel-omtema, ingen endring i eksisterende komponenter nødvendig)
- [ ] Flere språk
- [ ] Flere animasjoner
- [ ] Tastatursnarveier
- [ ] Innstillinger

---

## Teknisk gjeld

- [ ] Gjennomgå komponenter for gjenbruk
- [ ] Optimalisere API-kall
- [ ] Forbedre feilhåndtering
- [ ] Redusere unødvendige re-renders
- [x] Flere enhetstester (Vitest: atlasEngine, orderBlockEngine, fairValueGapEngine, aiDecisionEngine, liquidityEngine, marketStructureEngine, trendEngine — 20 tester totalt)

---

## Før v1.0

- [ ] Full mobiloptimalisering
- [ ] Ytelsesoptimalisering
- [ ] Lukket betatest
- [ ] Feilretting
- [ ] Endelig dokumentasjon