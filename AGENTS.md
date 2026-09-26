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

REST is **Hono + `@hono/zod-openapi`**, not TanStack `server.handlers` (except thin splat adapters below). Do not add new `src/routes/api/*.ts` files with per-route handlers for REST — define routes in `src/api/v1/` and mount them on the Hono app.

### How requests reach handlers

| URL prefix | Wiring | Implementation |
| --- | --- | --- |
| `/api/v1/*` | [`src/routes/api/v1.$.ts`](src/routes/api/v1.$.ts) → `app.fetch(request)` | [`src/api/v1/index.ts`](src/api/v1/index.ts) (`basePath("/api/v1")`) |
| `/api/auth/*` | [`src/routes/api/auth.$.ts`](src/routes/api/auth.$.ts) → `auth.handler` | [`src/lib/auth.ts`](src/lib/auth.ts) (better-auth; **not** in OpenAPI) |

TanStack only forwards bytes; path matching, validation, auth, and OpenAPI metadata live in Hono.

### Layout (`src/api/v1/`)

| File | Role |
| --- | --- |
| `index.ts` | Root `OpenAPIHono`, `basePath`, security schemes, `app.route(...)` mounts, `app.doc("/openapi.json", …)`, Scalar at `/docs`. Bump `API_VERSION` when the public contract changes. |
| `schemas.ts` | Request/response Zod schemas — import `z` from `@hono/zod-openapi` so types validate at runtime and appear under `#/components/schemas` in the spec. |
| `middleware/auth.ts` | `apiAuth` — session cookie or `Authorization: Bearer`; sets `userId` / `session` on context. |
| `routes/<name>.ts` | One sub-app per resource: `new OpenAPIHono()`, optional `use("*", apiAuth)`, `createRoute` + `subApp.openapi(route, handler)`, `export default subApp`. |

OpenAPI is **generated at runtime** from `createRoute` definitions (`GET /api/v1/openapi.json`). No generate script or committed spec file. Scalar UI: `GET /api/v1/docs`.

`servers` in the doc is `{ url: "/" }` so paths stay absolute (e.g. `/api/v1/ping`) against the request origin.

### Current routes

- `GET /api/v1/ping` — liveness (`routes/ping.ts`, requires `apiAuth`).
- `GET /api/v1/openapi.json`, `GET /api/v1/docs` — spec + Scalar (`index.ts`; no `apiAuth` on these).

### Add or change a REST endpoint

1. **Schemas** — Add or update Zod schemas in `schemas.ts` (`.openapi("ComponentName")` on objects you expose).
2. **Sub-app** — Create or edit `routes/<name>.ts`:
   - `subApp.use("*", apiAuth)` unless the route must stay public (rare).
   - Define `createRoute({ method, path: "/", … })` — path is relative to the mount prefix in step 3.
   - Register with `subApp.openapi(route, handler)`; use `c.req.valid("json" | "query" | "param")` for inputs.
   - Document `401` with `errorResponseSchema` when using `apiAuth`.
   - Set `security: [{ BearerAuth: [] }]` on the route (scheme name matches `index.ts`).
3. **Mount** — In `index.ts`: `app.route("/<segment>", <subApp>)` → public URL `/api/v1/<segment>` (and nested paths if the sub-app defines them).
4. **Verify** — `bun run dev`, hit `/api/v1/docs` or `/api/v1/openapi.json`; authenticated calls need cookie or bearer.

**Do not** edit `src/routes/api/v1.$.ts` when adding endpoints (unless you need new HTTP methods on the splat). **Do not** put REST logic in `createServerFn` if it should appear in OpenAPI — use Hono unless the caller is only the React app (then `src/server/` is fine).

### Auth for API vs app

- Hono: `apiAuth` in `middleware/auth.ts` (401 JSON: `Invalid or missing authorization token or session`).
- TanStack server functions: `requireUserMiddleware` / `getSessionFn` in `src/server/session.ts`.
- `/api/auth/*`: sign-in/session only; no `apiAuth`.

### Versioning

Ship **v2** by copying `src/api/v1/` → `src/api/v2/`, change `basePath`, add `src/routes/api/v2.$.ts`. v1 and v2 can run side by side.

### Not HTTP REST

- App RPC: `createServerFn` in `src/server/` (e.g. `session.ts`, `health.ts`) — invoked from React, not listed in OpenAPI.

## Auth

- `src/lib/auth.ts`: email OTP + magic link in one email, `disableSignUp: true`; cookies (`tanstackStartCookies`) + optional Bearer (`bearer()`).
- Sign-in requires pre-created `user` row in D1 and Cloudflare Email destination allowlist; client in `src/lib/auth-client.ts`.
- Session: `auth.api.getSession({ headers })` or `getSessionFn`; protect functions with `requireUserMiddleware` (401).
- Env: `APP_URL`, `BETTER_AUTH_SECRET`, `EMAIL_FROM` (`.env.example`).

## Database

- Schema: Better Auth tables in `auth-schema.ts`, exported via `src/lib/schema.ts` (`user`, `session`, `account`, `verification`).
- Access: `drizzle(env.DB, { schema })` and `dbMiddleware` (`src/lib/db.ts`).
- Migrations: `bun run db:generate` → SQL in `drizzle/migrations/`; apply local/remote via package scripts (remote on deploy).
