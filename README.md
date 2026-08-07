# Next Video Tube — Telegram Mini App Starter

A production-oriented starter for **Next Video Tube**:
- Telegram Bot + Telegram Mini App
- RGB/glow mobile-first UI
- Content preview + unlock flow
- Monetag Rewarded Interstitial integration point
- Cloudflare Worker + D1-ready backend
- Monetag server-side postback endpoint
- Admin API placeholders
- No secrets committed to Git

## Important
This project intentionally does **not** include a Monetag zone ID, SDK URL, Telegram bot token, admin password, or database credentials. Add those as Cloudflare secrets/config after creating your own accounts.

Do not use your own devices, bots, fake traffic, forced clicks, or misleading ad interactions. Only real user activity should generate monetization.

## Structure

- `public/` — website / Telegram Mini App
- `src/worker.js` — Cloudflare Worker API + Telegram webhook + Monetag postback
- `schema.sql` — D1 database schema
- `wrangler.jsonc` — Cloudflare Workers configuration
- `.dev.vars.example` — local secret template
- `public/config.js` — public, non-secret app settings
- `public/assets/project-preview.png` — visual concept image

## Monetag setup

Monetag currently supports Rewarded Interstitial, Rewarded Popup and In-App Interstitial for Telegram Mini Apps. For content unlocking, this starter uses the **Rewarded Interstitial** concept.

1. Create/register your Monetag publisher account.
2. Add your Telegram Mini App.
3. Create a Rewarded Interstitial SDK tag.
4. Put the SDK script URL and zone/function name into `public/config.js`.
5. Configure a server-side postback in Monetag to:
   `/postback?ymid={ymid}&zone={zone_id}&event={event_type}&value={reward_event_type}&price={estimated_price}&telegram_id={telegram_id}&source={request_var}`
6. Use `reward_event_type=valued` as the server-side condition for verified monetization.

The exact SDK URL and generated `show_XXXXXX` function are supplied by Monetag, so do not invent them.

## Telegram setup

1. Create a bot with BotFather.
2. Create/host the Mini App on HTTPS.
3. Set the Mini App URL in BotFather.
4. Add the bot token to Cloudflare as a secret:
   `wrangler secret put TELEGRAM_BOT_TOKEN`
5. Deploy the Worker.
6. Set the webhook to:
   `https://YOUR-DOMAIN/telegram/webhook`

The Worker includes a small `/start` handler that sends a button opening the Mini App.

## Cloudflare setup

Current Cloudflare Workers supports static assets + Worker API logic in one deployment.

Install Wrangler:
`npm install`

Login:
`npx wrangler login`

Create D1:
`npx wrangler d1 create next-video-tube`

Put the returned database binding into `wrangler.jsonc`, then:
`npx wrangler d1 execute next-video-tube --remote --file=schema.sql`

Local:
`npm run dev`

Deploy:
`npm run deploy`

## What is production-ready vs. still to configure

Ready in this starter:
- UI shell
- content cards
- Telegram WebApp initialization
- unlock UX
- unique ad-event IDs (`ymid`)
- Monetag SDK hook
- postback endpoint
- D1 schema
- Telegram webhook route
- Cloudflare static assets

You still must configure:
- Monetag SDK tag/zone
- Monetag postback URL
- Telegram bot token
- Telegram Mini App URL
- Cloudflare D1 database binding
- Your legal content/media
- Admin authentication before exposing admin actions

## Revenue expectation

Revenue is not guaranteed. Monetag says CPM varies by country, device, placement, ad format and frequency. Real traffic quality matters much more than simply increasing ad frequency.
