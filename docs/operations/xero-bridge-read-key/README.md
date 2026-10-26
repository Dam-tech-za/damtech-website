# Xero bridge: read-only key for the website

**Status:** patch prepared and tested 26 Oct 2026. **Not deployed.** The bridge is a live Edge Function that the agents use, so the maintainer deploys this with the owner's go-ahead.

## Why

The bridge has one static key (`BRIDGE_API_KEY`) and runs with `WRITE_MODE=full`, so that key can send invoices, record payments and void invoices. The website only needs to read. Its client already refuses write tools, but that check runs on the website. If the website's key leaked, someone could still change the books. A separate read key that the **bridge** enforces closes that gap. It also keeps the single OAuth connection: the bridge is unchanged as the only thing that talks to Xero, and no new Xero app is created.

## What the patch does

- New optional secret `BRIDGE_READ_API_KEY`. It is ignored if empty or the same as `BRIDGE_API_KEY`.
- With the read key:
  - `/api/<tool>` runs read tools only. Write tools get 403 before Xero is called.
  - `/api/tools` lists only read tools, and `/api/status` reports `write_mode: "read"`.
  - `/mcp` offers only read tools.
  - `/keepalive` returns 401, because it stays on the main key.
- The main key and every existing agent behave exactly as before.

Files: `read-key.patch` (changes to `app.ts` and `index.ts`) and `read_key.test.ts` (8 tests, all passing under Node 22 with `--experimental-transform-types` and the bridge's pinned hono, zod and MCP SDK versions).

## Deploy steps (maintainer, after approval)

1. Apply `read-key.patch` to `supabase/functions/xero-bridge/` and run the bridge's own tests (`deno test --allow-env app_test.ts`) plus `read_key.test.ts`.
2. `openssl rand -base64 32` → set it as Edge Function secret `BRIDGE_READ_API_KEY`. Never paste it in chat or commit it.
3. Redeploy all nine files with `verify_jwt: false` (see the bridge guide, section 6).
4. Check: `GET /api/status` with the read key shows `write_mode: "read"`. `POST /api/send_invoice` with the read key returns 403.
5. Put the same value in Vercel as `XERO_BRIDGE_API_KEY` (Production and Preview). The website never receives the main key.

## Other review notes on the bridge (no change made)

| Finding | Risk | Suggestion |
|---|---|---|
| Status page `GET /` needs no key and shows the organisation name and write mode | Low (information only) | Hide the write mode, or put the page behind the admin key |
| `/auth/start?key=` puts the admin key in the URL, so it can end up in logs and history | Low | Rotate `BRIDGE_ADMIN_KEY` after each login, or switch to a form POST |
| One static key shared by every agent | Medium | Give each agent its own key later, so you can revoke one without the others |
| Key comparison is constant-time, tokens are refreshed under a database lock, and the token tables are not reachable through the public API | — | Good as built |
