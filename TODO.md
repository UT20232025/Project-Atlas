# Genwelth AI — TODO / Ønskeliste

Levende liste over ting å utbedre, ideer og ønsker. Christer legger til, Claude holder den ryddig.

_Sist oppdatert: 2026-08-09_

---

## 🎯 Vil ha / bygge

- [ ] **PDH / PDL-indikator (MÅ-HA).** Previous Day High / Previous Day Low — forrige (fullførte) dags høy og lav som nøkkelnivåer. Vises som linjer på coin-chartet + i «Nøkkelnivåer»-kortet, og kan mates inn i Atlas' støtte/motstand-kontekst. Beregnes fra forrige daglige candle.
- [ ] **Prisvarsel (in-app).** Sett et målnivå på en mynt/aksje, få varsel når det treffes (uten epost — in-app / evt. Telegram). _(Godkjent av Christer.)_
- [ ] **Ytelse per tidsramme/signaltype.** Vis hvilken ramme/strategi som treffer best historisk. _(Godkjent.)_
- [ ] **«Del signal»-kort (bilde).** Auto-generert delbart bilde av et signal for sosiale medier — kobler på promo-kanalene når de er live. _(Godkjent.)_
- [ ] **Tidsramme på dashbordet.** Coin-siden har velgeren; gjenstår samme på dashbordets scanner/charts (client-pollet, større jobb). Evt. flere rammer (2t/12t krever utvidelse av intervall-typen).
- [ ] **Linktre til promo-kanaler.** Lenker til X, TikTok, Instagram (footer/landingsside/meny). Trenger faktiske URL-er fra Christer; X er på vent.

## 🐞 Utbedre / polish

- [ ] **RSI ser "jalla" ut.** RSI-visningen må pusses opp. Er nå tidsramme-styrt, men selve visningen kan bli bedre. Trenger at Christer beskriver hva som ser feil ut.

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

## 🚫 Bestemt: ikke nå

- Epost-varsler for signaler — **droppet** (ønskes ikke)
- X/Twitter-distribusjon — **på vent** (linktre-lenke er OK)
