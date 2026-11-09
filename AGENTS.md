# LUMIÈRE Hair Salon — environment notes

The salon site is a single Cloudflare Worker (`worker.js`) with static server-rendered
pages and a JSON API under `/api/*`. Data lives in Cloudflare D1 (SQLite), which runs
locally inside the sandbox through `wrangler dev --local`.

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

The `web` service runs Node 22 with `wrangler dev` on `0.0.0.0:3000`. On startup it
installs npm dependencies if `node_modules/wrangler` is missing, applies `schema.sql`
(idempotent `CREATE TABLE IF NOT EXISTS`), applies `seed.sql` (idempotent
`INSERT OR IGNORE` with fixed ids), then starts the dev server with live reload.

Local state (the D1 SQLite file) is written to `.wrangler/state` inside the mounted
repo and survives restarts. To start from a clean database, delete `.wrangler/state`
and restart the service, or run `npm run db:schema && npm run db:seed` in the container.

## Accounts

- Staff dashboard: `/admin` — seeded on first request from `ADMIN_EMAIL` /
  `ADMIN_PASSWORD` environment variables, defaulting to
  `admin@lumiere-salon.com` / `LumiereAdmin!2026`. Change these via app env vars.
- Client accounts: `/signup` — passwords are PBKDF2-SHA256 hashes, sessions are
  HttpOnly cookies stored in the `sessions` table.

## Email

Booking confirmations, reschedules, cancellations, gift cards and contact-form
notifications are always written to the `email_outbox` table. When `RESEND_API_KEY`
is present they are also delivered through Resend, with `EMAIL_FROM` as the sender.
Without a key the admin dashboard states that no provider is connected.

## Telegram bot + Mini App

The owner runs the salon from Telegram. Everything is backed by the same domain
functions in `src/salon.js`, so the website, the bot and the panel never disagree.

| Piece | Where | Notes |
| --- | --- | --- |
| Bot webhook | `POST /telegram/webhook` | `src/bot.js`. Only `TELEGRAM_CHAT_ID` is served; every other chat is ignored silently. |
| Mini App panel | `/tg` | `src/pages/tg.js` + `src/tgapp.js`. Auth = Telegram `initData` HMAC-checked with the bot token and matched to the owner chat id (`src/tgapi.js`). No cookies, no password. |
| Panel API | `/api/tg/*` | Same initData header (`x-telegram-init-data`). |
| On-site edit mode | any page with `?edit=1` | `src/edit.js`. Activates only when initData validates; tap an image to replace it, gallery add/delete. |
| Uploaded images | `media` table, served at `/media/<id>` | 4 MB limit, JPG/PNG/WebP/GIF/AVIF. Image slots are settings keys and `service:<id>` / `stylist:<id>` / `gallery:<id>`. |
| Availability | `src/salon.js` → `availableSlots` | Per-day hours + day-off, slot interval (15/30/60), daily break, closures (single day, range, indefinite), and manual blocks. Overlap-aware, so a long service cannot double-book a shorter slot. |

Environment variables:

- `TELEGRAM_BOT_TOKEN` — stored secret, delivered through `/run/base44/app.env`. Wrangler
  only exposes bindings from `wrangler.toml` and `.dev.vars`, not the process environment,
  so the Compose startup command writes a gitignored `.dev.vars` (bot token + `PUBLIC_ORIGIN`)
  before `wrangler dev` starts. Add any new Worker secret to that same block.
- `TELEGRAM_CHAT_ID` — plain `[vars]` value in `wrangler.toml` (the owner's chat id).
- `PUBLIC_ORIGIN` — public HTTPS origin used for Mini App buttons and email links. In the
  sandbox it is built from `BASE44_PUBLIC_HOST_SUFFIX`; in production set it in `[vars]`.
- `[triggers]` cron `0 15 * * *` (≈08:00 Los Angeles) sends the daily summary when
  `daily_summary` is `1`. Wrangler does not fire crons locally — use the bot's
  "Send today's summary" button instead.

Local verification without Telegram: the panel API can be exercised with a signed
`initData` generated inside the container from the bot token (never print it), for example a
Node snippet that HMACs `WebAppData` → token → `auth_date`/`user` and posts with
`x-telegram-init-data`.

## Notes

- Pages and API responses are `cache-control: no-store` in development.
- Images come from Unsplash's CDN and fonts from Google Fonts, so the preview needs
  outbound network access.
- `/health` returns `ok` for the Compose healthcheck.
- `PUBLIC_ORIGIN` is optional; it prefixes management links inside emails.
