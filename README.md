# TanStack Start + Cloudflare Workers starter

Minimal TanStack Start app on Cloudflare Workers with:

- **better-auth** email OTP + magic link (existing users only)
- **Cloudflare D1** via Drizzle
- **Cloudflare R2** storage binding
- **Cloudflare Email** for sign-in codes (works on Workers Free tier with destination allowlisting)

## Stack

- TanStack Start (React) with server functions
- better-auth (drizzle adapter, TanStack Start cookies plugin)
- Cloudflare D1 + R2 + Email Sending
- [shadcn/ui](https://ui.shadcn.com) on **Base UI** (`@base-ui/react`, `base-nova` preset) + Tailwind CSS v4
- Bun package manager

## UI (shadcn + Base UI)

Styling and components follow shadcn/ui with [Base UI](https://base-ui.com) primitives instead of Radix. Config is in [`components.json`](components.json) (`style`: `base-nova`, Phosphor icons, mist palette).

| Piece | Location |
| --- | --- |
| Components | [`src/components/ui/`](src/components/ui/) — source you own and can edit |
| Theme tokens | [`src/styles.css`](src/styles.css) — CSS variables + `@import "shadcn/tailwind.css"` |
| `cn()` helper | [`src/lib/utils.ts`](src/lib/utils.ts) — re-exports `cn` for merging Tailwind classes |

Primitives such as `Button`, `Input`, and `Tooltip` import from `@base-ui/react/*`. Layout helpers like `Field` and `Label` are plain elements with shared `data-slot` styling.

### Add or update components

```bash
bunx shadcn add card          # add a new component (installs deps as needed)
bunx shadcn diff              # see if local files differ from the registry
bun update @base-ui/react       # bump Base UI when a new release ships
```

### Use in the app

Import from the `@/components/ui/*` alias:

```tsx
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
```

[`src/routes/__root.tsx`](src/routes/__root.tsx) wraps the app with `TooltipProvider` (needed for tooltips) and `Toaster` (Sonner). Example usage: sign-in in [`src/components/auth.tsx`](src/components/auth.tsx).

## API

The public REST API is a **versioned Hono app** with **OpenAPI 3.1** from [`@hono/zod-openapi`](https://github.com/honojs/middleware/tree/main/packages/zod-openapi). TanStack Start does not implement REST handlers directly — it only exposes two catch-all server routes that forward traffic.

### Architecture

```
Client
  ├─ /api/v1/*     → src/routes/api/v1.$.ts  → app.fetch()  → src/api/v1/ (Hono)
  └─ /api/auth/*   → src/routes/api/auth.$.ts → auth.handler → src/lib/auth.ts
```

- **Define and change REST** in [`src/api/v1/`](src/api/v1/) only. Do not add new per-path files under `src/routes/api/` for REST (the `v1.$.ts` splat already covers all `/api/v1/*` paths).
- **OpenAPI** is built automatically when Hono registers `createRoute` handlers. Fetch [`/api/v1/openapi.json`](http://localhost:3000/api/v1/openapi.json) in dev or production; browse [`/api/v1/docs`](http://localhost:3000/api/v1/docs) (Scalar). There is no separate generate step or checked-in spec file.
- **React-only server logic** stays in [`src/server/`](src/server/) as `createServerFn` (not part of OpenAPI). Example: [`checkBindingsFn`](src/server/health.ts).

### Routes today

| Path | Defined in | Methods | Auth |
| --- | --- | --- | --- |
| `/api/v1/ping` | [`src/api/v1/routes/ping.ts`](src/api/v1/routes/ping.ts) | `GET` | Session cookie or Bearer |
| `/api/v1/openapi.json` | [`src/api/v1/index.ts`](src/api/v1/index.ts) | `GET` | No |
| `/api/v1/docs` | [`src/api/v1/index.ts`](src/api/v1/index.ts) | `GET` | No |
| `/api/auth/*` | [`src/routes/api/auth.$.ts`](src/routes/api/auth.$.ts) | `GET`, `POST` | better-auth flows (sign-in, session) |

The auth splat forwards to `auth.handler(request)` from [`src/lib/auth.ts`](src/lib/auth.ts). The browser uses [`authClient`](src/lib/auth-client.ts). Auth paths are intentionally **omitted** from the OpenAPI document.

### Source layout (`src/api/v1/`)

| File | Purpose |
| --- | --- |
| [`index.ts`](src/api/v1/index.ts) | Root app: `basePath("/api/v1")`, Bearer security scheme, `app.route("/…", subApp)`, `app.doc("/openapi.json", …)`, Scalar at `/docs`. Update `API_VERSION` when clients should track contract changes. |
| [`schemas.ts`](src/api/v1/schemas.ts) | Shared Zod models for requests/responses. Always `import { z } from "@hono/zod-openapi"` and `.openapi("Name")` on exported objects. |
| [`middleware/auth.ts`](src/api/v1/middleware/auth.ts) | `apiAuth` middleware — validates Better Auth session; exposes `userId` and `session` on the Hono context. |
| [`routes/<name>.ts`](src/api/v1/routes/ping.ts) | One default-exported `OpenAPIHono` sub-app per resource area. |

`basePath("/api/v1")` ensures OpenAPI `paths` keys look like `/api/v1/ping`. The document uses `servers: [{ url: "/" }]` so clients resolve against the current host.

### How to add or change an endpoint

1. **Model the contract** in [`schemas.ts`](src/api/v1/schemas.ts) (request body, query, params, success and error responses). Reuse [`errorResponseSchema`](src/api/v1/schemas.ts) for 401/4xx JSON bodies where appropriate.

2. **Implement the sub-app** in `src/api/v1/routes/<name>.ts` (copy the pattern from [`ping.ts`](src/api/v1/routes/ping.ts)):
   - `const subApp = new OpenAPIHono<{ Variables: ApiAuthVariables }>()`
   - `subApp.use("*", apiAuth)` on protected resources
   - `createRoute({ method, path: "/", tags, summary, security: [{ BearerAuth: [] }], request: { … }, responses: { … } })`
   - `subApp.openapi(route, async (c) => { … })` — read validated input via `c.req.valid("json")`, etc.
   - `export default subApp`

3. **Mount** in [`index.ts`](src/api/v1/index.ts): `app.route("/<url-segment>", subApp)` → handlers are served at `/api/v1/<url-segment>` (plus any extra path segments on the `createRoute`).

4. **Check the spec** — restart or refresh dev, open `/api/v1/docs`, confirm the new operation and schemas. No extra build target for OpenAPI.

5. **Changing behavior** — edit the route handler and/or schemas; bump `API_VERSION` in `index.ts` if the change is breaking for API consumers.

**Nested paths:** use `path: "/{id}"` (or deeper) in `createRoute` within the same sub-app, or mount another sub-app at `app.route("/books", booksApp)` and keep `path: "/"` for collection routes.

**New API major version:** duplicate the `src/api/v1/` tree to `src/api/v2/`, set `basePath("/api/v2")`, add `src/routes/api/v2.$.ts` mirroring `v1.$.ts`.

### Try it

```bash
curl -s http://localhost:3000/api/v1/ping
# {"error":"Invalid or missing authorization token or session"}

curl -s http://localhost:3000/api/v1/openapi.json | head
# OpenAPI 3.1 JSON

open http://localhost:3000/api/v1/docs
# Scalar UI
```

### Authentication for `/api/v1/*`

Sessions come from better-auth after OTP or magic-link sign-in. [`src/lib/auth.ts`](src/lib/auth.ts) supports:

| Mechanism | How | Typical use |
| --- | --- | --- |
| **Session cookie** | `tanstackStartCookies()` on the app origin | Browser, same-origin `fetch` |
| **Bearer token** | `Authorization: Bearer <token>` (`bearer()` plugin) | Scripts, mobile, non-browser clients |

Hono routes use [`apiAuth`](src/api/v1/middleware/auth.ts) (`auth.api.getSession` on the incoming request). TanStack server functions use [`getSessionFn`](src/server/session.ts) / [`requireUserMiddleware`](src/server/session.ts) instead — same session, different entrypoint.

`/api/auth/*` is not wrapped in `apiAuth`; it implements sign-in and session management.

Sign-up is disabled (`disableSignUp: true`); only pre-created users can sign in. See [Auth: email allowlist + pre-created users](#auth-email-allowlist--pre-created-users) below.

Agent-oriented summary: [`AGENTS.md`](AGENTS.md) § HTTP API.

## Setup

1. Install dependencies:

```bash
bun install
```

2. Copy the env template and fill in values (`.env` is gitignored):

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Public base URL (better-auth magic links / trusted origins). Local: `http://localhost:3000`. |
| `BETTER_AUTH_SECRET` | Session signing secret. Generate with `npx @better-auth/cli secret`. |
| `EMAIL_FROM` | Sender address on a domain onboarded in [Cloudflare Email Service](https://developers.cloudflare.com/email-service/). |
| `CLOUDFLARE_*` | Local tooling only (drizzle-kit / wrangler CLI). |

For the deployed Worker, set the same runtime values (`APP_URL`, `EMAIL_FROM`, `BETTER_AUTH_SECRET`) as Worker secrets / vars in the Cloudflare dashboard (or `.dev.vars` for `wrangler dev`).

3. Create a D1 database and R2 bucket in the Cloudflare dashboard, then update [`wrangler.jsonc`](wrangler.jsonc):

- `d1_databases[0].database_id` — your D1 database ID
- `d1_databases[0].database_name` — must match migrate scripts (`starter_db` by default)
- `r2_buckets[0].bucket_name` — your R2 bucket name
- Optionally rename the worker (`name`)

After editing wrangler config, regenerate types:

```bash
bun run cf-typegen
```

4. Generate and apply D1 migrations:

```bash
bun run db:generate          # create SQL under drizzle/migrations/
bun run db:migrate:local     # local D1 only — run yourself; never automated
```

Remote migrations run on deploy (`bun run deploy`) or via `bun run db:migrate:remote`.

5. Start the app:

```bash
bun run dev
```

For real auth email delivery during development, use the remote Worker preview (Email binding uses `remote: true`):

```bash
bunx wrangler dev --remote
```

## Auth: email allowlist + pre-created users

Sign-up is **disabled** (`disableSignUp: true`). Two steps are required before anyone can receive a sign-in email and log in:

### 1. Allowlist destination emails in Cloudflare

On the **Workers Free** tier, Cloudflare Email Sending only delivers to addresses you have **pre-approved in the Cloudflare dashboard** (Email Sending destination allowlist). Add every person who should sign in there **before** requesting an OTP. If an address is missing from the allowlist, Cloudflare will not send the auth email.

Also onboard your sending domain / `EMAIL_FROM` address in Cloudflare Email Service.

### 2. Pre-create the user row in D1

Because registration via OTP is disabled, the email must already exist in the `user` table. After migrations are applied, insert a row (local example):

```bash
wrangler d1 execute starter_db --local --command "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES ('user_demo', 'Demo User', 'you@example.com', 1, unixepoch() * 1000, unixepoch() * 1000);"
```

For remote D1, use `--remote` instead of `--local`. Replace the id, name, and email as needed.

Only after **both** the Cloudflare email allowlist entry and the D1 user row exist will `Send sign-in email` succeed and the OTP / magic link work.

## Scripts

| Script | Description |
| --- | --- |
| `bun run dev` | Vite + Cloudflare local dev on port 3000 |
| `bun run build` | Production build |
| `bun run deploy` | Build, deploy Worker, apply remote D1 migrations |
| `bun run db:generate` | Generate migrations from `src/lib/schema.ts` |
| `bun run db:migrate:local` | Apply migrations to local D1 |
| `bun run db:migrate:remote` | Apply migrations to remote D1 |
| `bun run cf-typegen` | Regenerate `worker-configuration.d.ts` from wrangler |

## Project layout

- `components.json` — shadcn/ui CLI config (Base UI / `base-nova`)
- `src/components/ui/` — shadcn components (Base UI primitives + shared styles)
- `auth-schema.ts` — better-auth Drizzle tables
- `src/lib/schema.ts` — re-exports auth schema (extend here for app tables)
- `src/lib/auth.ts` — better-auth config (email OTP + magic link)
- `src/lib/db.ts` / `src/lib/r2.ts` — D1 middleware and R2 helper
- `src/routes/index.tsx` — sign-in UI when logged out; home when signed in
- `src/api/v1/` — **define REST here** (`index.ts`, `schemas.ts`, `middleware/`, `routes/`)
- `src/routes/api/` — **forward only** (`v1.$.ts` → Hono, `auth.$.ts` → better-auth); do not add per-route REST files
- `src/server/` — authenticated server functions (`session.ts`, `health.ts`)
