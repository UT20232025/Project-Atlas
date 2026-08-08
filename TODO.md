# Genwelth AI — TODO / Ønskeliste

Levende liste over ting å utbedre, ideer og ønsker. Christer legger til, Claude holder den ryddig.

_Sist oppdatert: 2026-08-08_

---

## 🎯 Vil ha / bygge

- [ ] **Velg tidsramme overalt.** Alle candlestick-charts (og RSI, se under) må ha en timeframe-velger — f.eks. 5 min, 15 min, 1t, 4t, 12t, 1d. Motoren støtter allerede flere intervaller; dette er å eksponere valget i UI-et og la analysen kjøre på valgt ramme.
- [ ] **TP & SL-anbefalinger på ALLE signaler.** Atlas Intelligens skal gi konkrete take-profit- og stop-loss-nivåer på hvert signal, ikke bare på noen. (Motoren regner allerede entry/SL/TP/R:R — sikre at det vises konsekvent på alle kort.)
- [ ] **Long-term & swing-trading-signaler.** En egen Atlas Intelligens-modus/visning som gir signaler for lengre horisont (swing / posisjon), ikke bare kortsiktig. Trolig koblet til tidsramme-valget over (høyere timeframes = swing/long).
- [ ] **Linktre til promo-kanaler.** Lenker til X, TikTok og Instagram, synlig et fornuftig sted (footer / landingsside / meny).

## 🐞 Utbedre / bugs / polish

- [ ] **RSI ser "jalla" ut.** Dagens RSI-visning må pusses opp — ser rotete/uferdig ut. Skal også kunne justeres på tidsramme (5–15 min, 1–4–12 t osv.), som resten av chartene.
- [ ] **Okse & bjørn (markedshumør-maskoten) er ikke bra nok.** Christer er ikke fornøyd med dagens bull/bear-figur. → **Christer sender bilder som inspirasjon; Claude redesigner ut fra dem.** _(Komponent: `components/dashboard/MarketBiasMascot.tsx`)_

## 💡 Ideer (kanskje senere)

- [ ] _(løse tanker, ikke bestemt ennå — kast inn her)_

### Claude foreslår (til vurdering)
- [ ] **Portefølje vs. Atlas-uenighet.** Flagg tydelig når din åpne posisjon går MOT Atlas' nåværende signal (du er LONG, Atlas sier SHORT) — tidlig varsel om at noe har snudd.
- [ ] **Posisjonsstørrelse-kalkulator.** Skriv inn risiko (% av kapital) + SL-avstand → Atlas foreslår størrelse. Passer naturlig med TP/SL-anbefalingene.
- [ ] **Sammenlign to assets side om side.** "BTC vs ETH akkurat nå" — signal, confidence og nøkkelnivåer ved siden av hverandre.
- [ ] **Prisvarsel (in-app).** Sett et målnivå på en mynt/aksje, få varsel når det treffes (uten epost — in-app / evt. Telegram).
- [ ] **Ytelse per tidsramme/signaltype.** Når timeframe-valget er på plass: vis hvilken ramme/strategi som treffer best historisk.
- [ ] **"Del signal"-kort (bilde).** Auto-generert delbart bilde av et signal for sosiale medier — kobler rett på promo-kanalene (X/TikTok/IG) når de er live.

---

## ✅ Nylig gjort (denne perioden)

- [x] Flere aksjer + ETF-er i Atlas (SPY, QQQ, ~65 tickere + firmanavn-søk) — deployet
- [x] Live signaltavle på watchlist (Atlas' nåværende signal per fulgt symbol) — deployet
- [x] Porteføljebevisst «Spør Atlas» (svarer på «hvordan ligger porteføljen min an?») — venter på deploy

## 🚫 Bestemt: ikke nå

- Epost-varsler for signaler — **droppet** (ønskes ikke)
- X/Twitter-distribusjon — **på vent** (tas opp igjen senere; men linktre-lenker er OK, se over)
