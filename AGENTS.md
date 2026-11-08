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

## Notes

- Pages and API responses are `cache-control: no-store` in development.
- Images come from Unsplash's CDN and fonts from Google Fonts, so the preview needs
  outbound network access.
- `/health` returns `ok` for the Compose healthcheck.
- `PUBLIC_ORIGIN` is optional; it prefixes management links inside emails.
