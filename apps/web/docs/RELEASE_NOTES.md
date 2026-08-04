# Genwelth AI – Release Notes

Nyeste versjon øverst. For en fil-for-fil-logg, se
[`CHANGELOG.md`](./CHANGELOG.md).

---

## v1.0 Beta — Lukket betatest

- Invitasjonskode-gated `/signup` (`BETA_INVITE_CODE`)
- Flytende tilbakemeldingsknapp, lagrer fri tekst + hvilken side testeren var på
- Full i18n på tvers av hele appen, inkludert selve Atlas-motorens
  forklaringstekst (tidligere kun UI-tekst) — engelsk, norsk, spansk,
  portugisisk, tysk
- Generell feilrettingsrunde og ytelsespass (cachet Track Record-beregningen,
  parallelliserte etterslep-henting, fjernet dødt API-lag)

## v0.8 — Brukeropplevelse

- Light/dark tema (CSS-variabel-drevet, ingen komponentendringer)
- Mobiloptimalisering (revidert på 375px viewport)
- Prisflash og signal-puls-animasjoner
- Tastatursnarveier (Ctrl/Cmd+K-søk, `/` for søk, `?` for hjelp)
- `/settings`-side

## v0.7 — Autentisering, abonnement, distribusjon

- Ekte innlogging (e-post/passord, ingen ekstern tjeneste)
- Portfolio/Journal/Watchlists ble bruker-eid data
- Stripe-abonnement (Genwelth AI Pro, 199 kr/mnd, 7 dagers prøve)
- Telegram-kanal med automatiske signaler
- Offentlig landingsside med live Track Record-tall for anonyme besøkende

## v0.6 — Atlas AI (utvidet)

- Multi-timeframe-analyse, support/motstand, trendstyrke, volumanalyse
- Verified Track Record — 24t-utfall for hvert LONG/SHORT-signal, verifisert
  mot ekte Binance-priser

## v0.5 — Trading

- Portfolio (live urealisert P&L), Trading Journal (auto-logging + CSV),
  egendefinerte Watchlists, pris- og signalvarsler

## v0.4 — Live Market

- Live Watchlist, sanntidsoppdateringer, Opportunity Card, signalhistorikk

## v0.3 — Vacation Release

- Første fungerende dashboard, Coin Terminal, Atlas Score, candlestick/RSI/
  MACD-grafer, Ctrl+K-søk

---

Migrering fra SQLite til Prisma Postgres skjedde i forbindelse med v0.7
(bruker-eid data + produksjonsdeploy krevde en ekte, delt database).
