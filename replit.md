# Capyboo3 Telegram Mini App

A Telegram Mini App that plays the supplied Capyboo3 loading video, then shows a full-screen “Airdrop Coming Soon” message.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/capyboo3-telegram` — Telegram Mini App frontend and supplied artwork

## Architecture decisions

- The Telegram Web Apps SDK is used to signal readiness, expand the Mini App, and follow Telegram viewport and theme changes.
- The supplied loading video plays once, then the Mini App switches to the airdrop notice.
- The API server reads `BOT_TOKEN` from Replit Secrets and handles Telegram webhook replies; never expose the token in frontend code.

## Product

The Mini App plays the supplied loading animation, then opens a full-screen dark page with one black message box reading “Airdrop Coming Soon.” No photo appears on the final page.

## User preferences

- Keep this as a Telegram Mini App, not a promotional website.
- Keep the post-video screen limited to the dark page and one “Airdrop Coming Soon” message box; do not add photos or other UI.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
