# Genwelth AI – Architecture

## Oversikt

Genwelth AI er bygget med en modulær arkitektur der hver komponent har ett tydelig ansvar. Målet er en kodebase som er enkel å vedlikeholde, teste og utvide.

---

# Teknologistakk

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- App Router

---

# Mappestruktur

```
app/
components/
services/
lib/
types/
docs/
```

---

# UI

Felles UI-komponenter ligger i:

```
components/ui/
```

Disse brukes på tvers av hele applikasjonen:

- Card
- Section
- Button
- Badge
- Progress

---

# Services

Forretningslogikk og API-kall ligger i service-laget.

Eksempler:

- dashboardService
- atlasEngine
- score

Dette holder komponentene enkle og fokuserte på visning.

---

# API-er

Prosjektet benytter blant annet:

- Binance
- CoinGecko
- Fear & Greed Index

API-kall håndteres sentralt for enklere vedlikehold og feilhåndtering.

---

# Designprinsipper

- Små komponenter
- Gjenbruk fremfor duplisering
- TypeScript overalt
- Tydelig ansvarsfordeling
- Konsistent design gjennom UI-kitet

---

# Kvalitet

Før hver release skal følgende være oppfylt:

- TypeScript uten feil
- Vellykket produksjonsbygg (`npm run build`)
- Git commit og push
- Oppdatert dokumentasjon