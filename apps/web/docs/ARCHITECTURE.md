# Genwelth AI – Arkitektur

## Oversikt

Genwelth AI er en Next.js 16 App Router-app. De fleste sidene er dynamiske
server-komponenter (auth-avhengige), med klient-komponenter for det som
faktisk trenger polling eller interaktivitet (live markedsdata, Atlas-panelet,
skjemaer).

---

## Teknologistakk

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS 4
- Prisma 7 med `@prisma/adapter-pg`, på Prisma Postgres (ikke SQLite lenger)
- next-intl for i18n (en/no/es/pt/de)
- Vitest for enhetstester
- Stripe (Checkout + Billing Portal + webhook)
- Telegram Bot API for offentlig signal-distribusjon
- Binance offentlige REST API som eneste markedsdatakilde (ingen API-nøkkel)

---

## Mappestruktur

```
app/                 Ruter (App Router) — hver undermappe er en side
  api/                REST-endepunkter (Atlas-analyse, Stripe-webhook)
  coin/[symbol]/       Coin-detaljside
  journal/ portfolio/ pricing/ settings/ track-record/ watchlists/
  login/ signup/       Auth-sider (offentlige, se proxy.ts)

components/          React-komponenter
  dashboard/           De fleste Atlas-kortene (Trend, Volume, Liquidity, ...)
  analysis/            Coin-side-spesifikke analyse-komponenter
  layout/              AppLayout, Sidebar, Topbar, UserMenu
  watchlist/ portfolio/ journal/ track-record/  Feature-spesifikke views
  landing/             Offentlig markedsføringsside for anonyme besøkende
  search/              Ctrl+K-søk og tastatursnarveier-hjelp
  feedback/            Tilbakemeldingsknapp (lukket betatest)
  ui/                  Delt UI-kit (Card, Button, Badge, Progress, Input ...)

lib/
  atlas/                Selve Atlas-motoren, se eget avsnitt under
  auth/                 Innlogging, sesjon (JWT i httpOnly-cookie)
  db/                   Prisma-klient
  services/              Ytre datakilder (live markedsdata, dashboard-data)
  api/binance.ts         Rå Binance-kall
  stripe/                Stripe-klient, checkout/portal actions, sync
  telegram/               Signalvarsling til Telegram-kanalen
  subscription/           Pro-gating (requirePro)
  watchlists/              Watchlist-spørringer
  feedback/                Tilbakemeldings-server-action
  trading/                 P&L-beregning, skjemaparsing for Portfolio/Journal

messages/            next-intl-oversettelser, én JSON-fil per språk
prisma/              schema.prisma + migrations
docs/                Denne mappa
```

---

## Auth

Ingen ekstern auth-leverandør. `lib/auth/`:

- `password.ts` — bcryptjs-hashing
- `session.ts` — signerer/verifiserer en JWT (jose) og setter den som en
  `httpOnly`, `secure`-cookie (`getSession()` er den billige, ikke-
  omdirigerende sjekken; `requireSession()`/`getCurrentUser()` omdirigerer
  til `/login` hvis sesjonen mangler eller brukeren er slettet)
- `claimOrphanedData.ts` — data opprettet før noen har registrert seg
  (Position/JournalEntry/Watchlist med `userId: null`) arves automatisk av
  den første kontoen som registreres

`proxy.ts` (Next.js middleware) beskytter alle sider unntatt en liten
whitelist (`/`, `/login`, `/signup`). "/" grener selv på om det finnes en
sesjon: ingen sesjon → offentlig landingsside; sesjon → vanlig dashboard.

Pro-gating skjer separat via `lib/subscription/requirePro.ts`
(`hasActiveSubscription()` sjekker `subscriptionStatus` på User-raden mot
`trialing`/`active`).

---

## Atlas-motoren (`lib/atlas/`)

Dette er kjernen i produktet. Ca. 13 delmotorer analyserer hver sin ting og
mates inn i én endelig beslutning:

| Fil | Ansvar |
|---|---|
| `trendEngine.ts` | EMA20/50/200-basert trendretning og styrke |
| `volumeEngine.ts` | Relativt volum, kjøps-/salgspress, volumtopper |
| `priceActionEngine.ts` | Swing-struktur, break of structure, change of character |
| `marketStructureEngine.ts` | Strukturanalyse (BOS/CHoCH-hendelser) |
| `liquidityEngine.ts` | Likviditetspoolar og -feiing |
| `multiTimeframeEngine.ts` | Vekter 15m/1h/4h mot hverandre |
| `orderBlockEngine.ts` | Institusjonelle etterspørsels-/tilbudssoner |
| `fairValueGapEngine.ts` | Ufylte fair value gaps |
| `whaleEngine.ts` | Store enkelthandler fra Binance sine siste trades |
| `riskEngine.ts` | Vurderer et konkret trade-oppsett (entry/stop/target, risiko/gevinst) |
| `tradeSetup.ts` | Bygger det faktiske trade-oppsettet (ATR-basert stop/target) |
| `atlasEngine.ts` | Faktor-scoring (trend/RSI/MACD/volum/momentum → 0-100-score) |
| `aiDecisionEngine.ts` | Kombinerer alt over til endelig LONG/SHORT/WAIT + confidence |

`getAtlasAnalysis.ts` kjører alle delmotorene parallelt for ett symbol,
`atlasAnalysisCache.ts` cacher resultatet 35s (litt lengre enn de 30s
klienten poller med) for å unngå at hver dashboard-oppdatering trigger en
full rescan av 20 mynter × 3 tidsrammer.

### Forklaringstekst er data, ikke strenger

Hver delmotor returnerer forklaringen sin som et `AtlasReasonCode`
(`{ code: string; params?: {...} }`) i stedet for en ferdig engelsk streng.
`lib/atlas/resolveReasonText.ts` slår opp riktig oversettelse i den delte
`AtlasReasons`-namespacen (209 nøkler × 5 språk i `messages/*.json`) og
håndterer det ene tilfellet som trenger en språkavhengig liste-sammenslåing
(Atlas' faktor-drevne oppsummeringssetning, via `Intl.ListFormat`).

En eldre, enklere motor (`lib/analysis/atlasEngine.ts` + `lib/binance.ts`)
lever fortsatt videre og driver deler av coin-siden (pris, RSI, EMA,
score-målerne) — men den dupliserte "Atlas Analysis"-forklaringsseksjonen
den en gang viste er fjernet siden den nyere motoren allerede dekker det.

---

## Abonnement (Stripe)

`lib/stripe/` — Checkout (hostet side), Billing Portal, webhook
(`app/api/stripe/webhook/route.ts`) holder `subscriptionStatus` oppdatert.
Status synkroniseres også umiddelbart ved retur fra Checkout, så brukeren
ikke må vente på webhooken. Kjører nå på **live Stripe-nøkler**.

## Distribusjon (Telegram)

`lib/telegram/notify.ts` poster automatisk til en offentlig Telegram-kanal
når et Atlas-signal endres til LONG/SHORT med confidence over en terskel
(`TELEGRAM_MIN_CONFIDENCE`, standard 70%). Gjenbruker den samme
signalendring-deteksjonen (`recordSignalIfChanged`) som Track Record og
signalhistorikken bruker, i stedet for en egen sjekk.

## Lukket betatest

`/signup` krever en invitasjonskode når `BETA_INVITE_CODE` er satt i
miljøet. En flytende "Tilbakemelding"-knapp (`components/feedback/`) lagrer
fri tekst + hvilken side brukeren var på, i en `Feedback`-tabell.

---

## Deployment

Prisma Compute (ikke Vercel), med `www.genwelth.com` som egendomene via
one.com (root-domenet kan ikke CNAME-es der, derfor `www`). Se README for
selve deploy-kommandoen. Migrasjoner kjøres separat fra deploy.
