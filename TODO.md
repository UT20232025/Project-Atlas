# Genwelth AI — TODO / Ønskeliste

Levende liste over ting å utbedre, ideer og ønsker. Christer legger til, Claude holder den ryddig.

_Sist oppdatert: 2026-08-08_

---

## 🎯 Vil ha / bygge

- [ ] **Velg tidsramme overalt.** ~~Coin-siden~~ har nå en tidsramme-velger (5m/15m/1t/4t/1d) som kjører hele analysen + RSI + MACD + candles på valgt ramme (server-side via URL). **Gjenstår:** samme velger på dashbordets charts/scanner hvis ønskelig, og evt. flere rammer (2t/12t krever utvidelse av intervall-typen).
- [x] **Long-term & swing-trading-signaler.** Egen «Swing-signaler (daglig)»-seksjon på dashbordet: Atlas kjører på 1d-ramme og viser de retningsbestemte kallene med TP/SL. — venter på deploy. _(Mulig utvidelse: velg swing-rammen (4t/1d/1u) og en dedikert /swing-side.)_
- [ ] **Linktre til promo-kanaler.** Lenker til X, TikTok og Instagram, synlig et fornuftig sted (footer / landingsside / meny).

## 🐞 Utbedre / bugs / polish

- [ ] **RSI ser "jalla" ut.** Dagens RSI-visning må pusses opp — ser rotete/uferdig ut. Skal også kunne justeres på tidsramme (5–15 min, 1–4–12 t osv.), som resten av chartene.
- [x] **Okse & bjørn (markedshumør-maskoten).** Byttet til Christers kinematiske brand-key-art — klippet det tekstfrie dyre-båndet ut av kilde-renderen til bull/bear/faceoff-bilder. Bullish=okse, bearish=bjørn, neutral=face-off. — venter på deploy

## 💡 Ideer (kanskje senere)

- [ ] _(løse tanker, ikke bestemt ennå — kast inn her)_

### Claude foreslår (til vurdering)
- [x] **Portefølje vs. Atlas-uenighet.** Flagg per posisjon: «Atlas enig / uenig / nøytral» ift. retningen din. — venter på deploy
- [ ] **Posisjonsstørrelse-kalkulator.** Skriv inn risiko (% av kapital) + SL-avstand → Atlas foreslår størrelse. Passer naturlig med TP/SL-anbefalingene.
- [x] **Sammenlign to assets side om side.** `/compare` — velg to mynter, Atlas' read side om side + «Atlas heller mot X»-vurdering. — venter på deploy
- [ ] **Prisvarsel (in-app).** Sett et målnivå på en mynt/aksje, få varsel når det treffes (uten epost — in-app / evt. Telegram).
- [ ] **Ytelse per tidsramme/signaltype.** Når timeframe-valget er på plass: vis hvilken ramme/strategi som treffer best historisk.
- [ ] **"Del signal"-kort (bilde).** Auto-generert delbart bilde av et signal for sosiale medier — kobler rett på promo-kanalene (X/TikTok/IG) når de er live.

---

## ✅ Nylig gjort (denne perioden)

- [x] Flere aksjer + ETF-er i Atlas (SPY, QQQ, ~65 tickere + firmanavn-søk) — deployet
- [x] Live signaltavle på watchlist (Atlas' nåværende signal per fulgt symbol) — deployet
- [x] Porteføljebevisst «Spør Atlas» (svarer på «hvordan ligger porteføljen min an?») — deployet
- [x] TP & SL-anbefalinger på alle signaler (Opportunity-kort, Atlas Intelligens sterkeste/svakeste, scanner-tabell) — venter på deploy

## 🚫 Bestemt: ikke nå

- Epost-varsler for signaler — **droppet** (ønskes ikke)
- X/Twitter-distribusjon — **på vent** (tas opp igjen senere; men linktre-lenker er OK, se over)
