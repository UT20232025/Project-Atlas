# Genwelth AI — TODO / Ønskeliste

Levende liste over ting å utbedre, ideer og ønsker. Christer legger til, Claude holder den ryddig.

_Sist oppdatert: 2026-08-09_

---

## 🎯 Vil ha / bygge

- [ ] **«Del signal»-kort (bilde).** Auto-generert delbart bilde av et signal for sosiale medier — kobler på promo-kanalene når de er live. _(Godkjent.)_
- [ ] **Tidsramme på dashbordet.** Coin-siden har velgeren; gjenstår samme på dashbordets scanner/charts (client-pollet, større jobb). Evt. flere rammer (2t/12t krever utvidelse av intervall-typen).
- [x] **Linktre / følg oss.** Telegram + X + TikTok + Instagram som «Følg oss»-rad i landing-footer, + Telegram-knapp i app-menyen. Alt styrt fra `SOCIAL_LINKS`. — venter på deploy

## 🐞 Utbedre / polish

- [x] **Signal-spam fikset.** Samme coin kringkastet 4× på 12 min (LONG-flapping). La til broadcast-cooldown per symbol+retning (default 120 min, `SIGNAL_BROADCAST_COOLDOWN_MINUTES`). Opptak til track record beholdes; kun kringkasting debounces. — venter på deploy
- [x] **TP/SL i signalene.** Telegram + push viser nå SL/TP/R:R + «ikke finansiell rådgivning». — venter på deploy
- [ ] **Exit-signaler.** Når Atlas ser at markedet snur mot en åpen posisjon: send «gå ut / flytt SL i profitt»-varsel. Krever å spore hvilke signaler som ble kringkastet + oppdage reversering. (Ønsket av Christer.)
- [ ] **Confidence-uniformitet.** Etter 95%-capet klumper alle sterke signaler på nøyaktig 95%. Vurder mykere skalering på toppen (f.eks. 80–95-spenn) så tallet varierer mer. (Christer merket det.)

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
- [x] PDH/PDL-indikator — forrige dags høy/lav på chart + Nøkkelnivåer (krypto + aksjer)
- [x] Prisvarsel (in-app) — sett over/under-nivå på coin-siden, dashbord varsler når det treffes
- [x] Ytelse per signaltype (LONG/SHORT) + konfidensnivå på track record-siden — venter på deploy _(NB: tidsramme-nedbrytning venter til vi evt. registrerer flere rammer enn 1t)_

## 🩹 Fikset underveis

- [x] **Confidence kappet til maks 95 %.** Et kringkastet «LONG AVAXUSDT · 100 %» bommet; 100 %-merkelapp som feiler ødelegger tillit. Ingen trade er sikker.
- [x] **Straff for LONG i premium / SHORT i discount.** Rotårsak til AVAX-bommen: scoringen var rent additiv, så et LONG kunne fyre rett under range-toppen uten straff. Nå straffes topp-jaging aktivt + advarsel vises. — venter på deploy

## 🚫 Bestemt: ikke nå

- Epost-varsler for signaler — **droppet** (ønskes ikke)
- X/Twitter-distribusjon — **på vent** (linktre-lenke er OK)
