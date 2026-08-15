# Genwelth AI — TODO / Ønskeliste

Levende liste over ting å utbedre, ideer og ønsker. Christer legger til, Claude holder den ryddig.

_Sist oppdatert: 2026-08-09_

---

## 🎯 Vil ha / bygge

- [x] **Read-only børs-tilkobling (foreslått av beta-tester).** Binance + Bybit **+ Coinbase (JWT ES256)** → live saldo, 24t-bevegelse, Atlas-signal per beholdning, og Atlas grunner porteføljesvar i ekte beholdning. AES-256-GCM-kryptert, verifisert, tilbakekallbar. — Coinbase venter på validering mot ekte nøkkel. _(Gjenstår: ekte P&L med kostpris.)_
- [x] **«Del signal»-kort (bilde).** `/api/signal-card/[symbol]` → 1200×630 PNG (coin, signal, confidence, entry/SL/TP/R:R, branding) via `next/og`. «Del signal-kort»-lenke på coin-siden. Fonter innbygd som base64 (self-fetch feilet i standalone). Verifisert live. — deployet
- [x] **Tidsramme på dashbordet.** 5m/15m/1t/4t/1d-velger på dashbordet (URL-styrt), hele scanner/heatmap/stats/Opportunity + live-poller følger valgt ramme. — deployet
- [x] **Linktre / følg oss.** Telegram + X + TikTok + Instagram som «Følg oss»-rad i landing-footer, + Telegram-knapp i app-menyen. Alt styrt fra `SOCIAL_LINKS`. — venter på deploy

## 🐞 Utbedre / polish

- [x] **Signal-spam fikset.** Samme coin kringkastet 4× på 12 min (LONG-flapping). La til broadcast-cooldown per symbol+retning (default 120 min, `SIGNAL_BROADCAST_COOLDOWN_MINUTES`). Opptak til track record beholdes; kun kringkasting debounces. — venter på deploy
- [x] **TP/SL i signalene.** Telegram + push viser nå SL/TP/R:R + «ikke finansiell rådgivning». — venter på deploy
- [x] **Exit-/reversal-signaler.** Når et kringkastet signal snur (LONG↔SHORT), sendes «gå ut / flytt SL i profitt»-varsel til Telegram + push. Sporer siste kringkastede retning per symbol; fyrer kun på ekte retningsvending. — venter på deploy
- [x] **Confidence-uniformitet.** Etter 95%-capet klumper alle sterke signaler på nøyaktig 95%. Vurder mykere skalering på toppen (f.eks. 80–95-spenn) så tallet varierer mer. (Christer merket det.)

- [x] **RSI pusset opp.** Tynn ikke-skalerende strek (den gamle 4px ble forvrengt av SVG-strekkingen → klumpete), grønn>70/rød<30 via vertikal gradient + fargesoner (TradingView-stil), og undertittel som viser valgt candle-ramme (velgeren øverst styrte allerede dataene). — deployet

## 💡 Ideer (løse tanker, ikke bestemt)

- [ ] _(kast inn her)_
- Posisjonsstørrelse-kalkulator finnes allerede på coin-siden (`PositionSizeCalculator`).

---

## ✅ Ferdig & deployet

- [x] Flere aksjer + ETF-er (SPY, QQQ, ~65 tickere + firmanavn-søk)
- [x] Live signaltavle på watchlist
- [x] Porteføljebevisst «Spør Atlas»
- [x] TP & SL-anbefalinger på alle signaler
- [x] Tidsramme-velger på coin-siden (5m/15m/1t/4t/1d)
- [x] Portefølje vs. Atlas-uenighet (enig/uenig/nøytral per posisjon)
- [x] Swing / long-term-signaler (daglig ramme)
- [x] Sammenlign to assets (`/compare`)
- [x] Ny maskot — kinematisk okse/bjørn (front-okse + brølende bjørn + face-off)
- [x] Ytelsesfiks — swing streames via Suspense + 10 min cache på 1d/4t
- [x] PDH/PDL-indikator — forrige dags høy/lav på chart + Nøkkelnivåer (krypto + aksjer)
- [x] Prisvarsel (in-app) — sett over/under-nivå på coin-siden, dashbord varsler når det treffes
- [x] Ytelse per signaltype (LONG/SHORT) + konfidensnivå på track record-siden — venter på deploy _(NB: tidsramme-nedbrytning venter til vi evt. registrerer flere rammer enn 1t)_

## 🩹 Fikset underveis

- [x] **Forsiden hang 10s («siden virker ikke nå»).** `getTrackRecord` hentet manglende inngangs-/utgangspriser fra Binance synkront på *hver* landing-render; hentingene hang ~10s på serveren og lagret aldri ved feil → hver visning kjørte dem på nytt. Render-stien er nå hentefri (rendrer kun fra priser i DB); pris-oppfylling flyttet til bakgrunn (throttlet fire-and-forget) + ny `/api/cron/resolve-outcomes` (CRON_SECRET). 10,5s → 0,5s. Track record intakt (56,3% / 394 signaler). — deployet

- [x] **Confidence kappet til maks 95 %.** Et kringkastet «LONG AVAXUSDT · 100 %» bommet; 100 %-merkelapp som feiler ødelegger tillit. Ingen trade er sikker.
- [x] **Straff for LONG i premium / SHORT i discount.** Rotårsak til AVAX-bommen: scoringen var rent additiv, så et LONG kunne fyre rett under range-toppen uten straff. Nå straffes topp-jaging aktivt + advarsel vises. — venter på deploy

## 🚫 Bestemt: ikke nå

- Epost-varsler for signaler — **droppet** (ønskes ikke)
- X/Twitter-distribusjon — **på vent** (linktre-lenke er OK)
