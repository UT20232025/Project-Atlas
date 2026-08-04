# Genwelth AI

Genwelth AI is a crypto trading-signals web app built around **Atlas**, an
in-house scoring/decision engine. It scans a fixed list of 20 Binance USDT
pairs, produces LONG/SHORT/WAIT signals with a confidence score and a
plain-language explanation, and tracks each signal's real 24h outcome so the
track record is independently verifiable rather than self-reported.

Live at **[www.genwelth.com](https://www.genwelth.com)**.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS 4**
- **Prisma 7** with the `@prisma/adapter-pg` driver adapter, on **Prisma Postgres**
- Auth: self-rolled email/password (bcryptjs + jose-signed JWT in an httpOnly
  cookie) — no external auth provider
- **Stripe** (Checkout + Billing Portal + webhook) for the Pro subscription
- **Telegram Bot API** for public signal distribution
- **next-intl** for i18n — English, Norwegian, Spanish, Portuguese, German
- **Vitest** for unit tests (Atlas engine coverage)
- Market data from the public **Binance** REST API (klines, ticker, recent
  trades) — no API key required

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with:

   | Variable | Purpose |
   |---|---|
   | `DATABASE_URL` | Prisma Postgres connection string |
   | `AUTH_SECRET` | Random secret used to sign session JWTs |
   | `STRIPE_SECRET_KEY` | Stripe secret key (test or live) |
   | `STRIPE_PRICE_ID` | Stripe Price ID for the Pro subscription |
   | `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
   | `TELEGRAM_BOT_TOKEN` | Bot token for the signals channel poster |
   | `TELEGRAM_CHANNEL` | Telegram channel/chat ID to post signals to |
   | `NEXT_PUBLIC_APP_URL` | Public base URL, used in outbound Telegram messages |
   | `BETA_INVITE_CODE` | Optional. If set, `/signup` requires this code (closed beta gate). Unset = open signup |

   `TELEGRAM_MIN_CONFIDENCE` is also read (defaults to `70`) to filter which
   signals get posted publicly.

3. Push the schema and generate the Prisma client:

   ```bash
   npx prisma migrate dev
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run a production build locally |
| `npm run test` | Run the Vitest suite |
| `npm run lint` | ESLint |

## Deployment

Deployed to **Prisma Compute** (not Vercel), with the `www.genwelth.com`
custom domain. Redeploy with:

```bash
npx @prisma/cli@latest app deploy --project <project-id> --app "Genwelth AI" --prod --yes
```

Database migrations are **not** run by the deploy — apply them separately
with `npx prisma migrate deploy` against the production `DATABASE_URL`.

## Documentation

See [`docs/`](./docs) for architecture notes, project status, and the
release history:

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — how the codebase is organized
- [`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md) — what's built, what's next
- [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) — version history
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — planned milestones
- [`docs/TODO.md`](./docs/TODO.md) — working task list (Norwegian)
