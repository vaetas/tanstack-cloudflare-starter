# Agent guide

Quick facts for navigating this repo (see `README.md` for setup).

## Project

- TanStack Start (React 19 SSR) on Cloudflare Workers via Vite (`@cloudflare/vite-plugin`, `@tanstack/react-start` in `vite.config.ts`).
- Deploy: `wrangler.jsonc` uses `main: @tanstack/react-start/server-entry` and serves `./dist/client`; Bun scripts in `package.json`.
- Source layout: `src/routes/` (pages + API), `src/lib/`, `src/server/`; routes codegen in `src/routeTree.gen.ts`.

## Stack

- Router/SSR/query: TanStack Router, Start, React Query; auth: `better-auth` + `@better-auth/drizzle-adapter`; ORM: Drizzle on D1; UI: Tailwind v4, shadcn/Base UI, Sonner.

## Bindings (`wrangler.jsonc`)

- D1 `DB` → `starter_db` (migrations `./drizzle/migrations`); R2 `STORAGE` → `starter-storage` (`src/lib/r2.ts`); Send Email `EMAIL` for auth mail (`src/lib/cloudflare-email.ts`, `EMAIL_FROM`).

## HTTP API

- File routes in `src/routes/api/` export `createFileRoute` + `server.handlers`.
- `GET /api/ping` — public health JSON (`ping.ts`).
- `GET|POST /api/auth/*` — forwards to `auth.handler` (`auth.$.ts`, `src/lib/auth.ts`).
- App RPC: `createServerFn` in `src/server/` (e.g. `session.ts`, `health.ts`), not under `/api/*`.

## Auth

- `src/lib/auth.ts`: email OTP + magic link in one email, `disableSignUp: true`; cookies (`tanstackStartCookies`) + optional Bearer (`bearer()`).
- Sign-in requires pre-created `user` row in D1 and Cloudflare Email destination allowlist; client in `src/lib/auth-client.ts`.
- Session: `auth.api.getSession({ headers })` or `getSessionFn`; protect functions with `requireUserMiddleware` (401).
- Env: `APP_URL`, `BETTER_AUTH_SECRET`, `EMAIL_FROM` (`.env.example`).

## Database

- Schema: Better Auth tables in `auth-schema.ts`, exported via `src/lib/schema.ts` (`user`, `session`, `account`, `verification`).
- Access: `drizzle(env.DB, { schema })` and `dbMiddleware` (`src/lib/db.ts`).
- Migrations: `bun run db:generate` → SQL in `drizzle/migrations/`; apply local/remote via package scripts (remote on deploy).
