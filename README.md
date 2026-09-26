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

HTTP endpoints are TanStack Start **server routes** under [`src/routes/api/`](src/routes/api/). Each file exports a `createFileRoute` with `server.handlers` for the HTTP methods you support.

### Routes

| Path | File | Methods | Purpose |
| --- | --- | --- | --- |
| `/api/ping` | [`src/routes/api/ping.ts`](src/routes/api/ping.ts) | `GET` | Public liveness check (no auth) |
| `/api/auth/*` | [`src/routes/api/auth.$.ts`](src/routes/api/auth.$.ts) | `GET`, `POST` | [better-auth](https://www.better-auth.com) HTTP API (catch-all splat) |

The auth route forwards every request to `auth.handler(request)` from [`src/lib/auth.ts`](src/lib/auth.ts). That includes sign-in flows (email OTP, magic link), session lookup, and sign-out. The browser UI talks to these paths through [`authClient`](src/lib/auth-client.ts) (`createAuthClient` with the email OTP and magic link client plugins).

Add more APIs by creating new files under `src/routes/api/` using the same `server.handlers` pattern as [`ping.ts`](src/routes/api/ping.ts) or `auth.$.ts`.

```bash
curl -s http://localhost:3000/api/ping
# {"ok":true,"time":"2026-01-01T12:00:00.000Z"}
```

App-specific server logic that is not a plain HTTP route can live as TanStack **server functions** under [`src/server/`](src/server/) (for example [`checkBindingsFn`](src/server/health.ts)). Those are invoked from React via `createServerFn`, not as public REST paths under `/api/*`.

### Authentication

Sessions are issued by better-auth after a successful OTP or magic-link sign-in. [`src/lib/auth.ts`](src/lib/auth.ts) enables two ways to send credentials on later requests:

| Mechanism | How | Typical use |
| --- | --- | --- |
| **Session cookie** | `tanstackStartCookies()` sets an HTTP-only session cookie on the app origin | Browser UI, same-origin `fetch`, TanStack server functions during SSR |
| **Bearer token** | `bearer()` plugin; send `Authorization: Bearer <token>` | Scripts, mobile apps, or other non-browser clients |

To resolve the current user, read the incoming request headers and call better-auth:

```ts
const session = await auth.api.getSession({ headers: request.headers });
if (!session?.user) {
  return new Response("Unauthorized", { status: 401 });
}
```

Server functions use the same check via [`getSessionFn`](src/server/session.ts) (`getRequestHeaders()` from TanStack Start). Protected functions attach [`requireUserMiddleware`](src/server/session.ts), which returns **401** with `UnauthorizedError` when there is no session (see [`checkBindingsFn`](src/server/health.ts)).

`/api/auth/*` endpoints themselves implement sign-in and session management; they are not wrapped in `requireUserMiddleware`. New `/api/*` routes you add should perform a session check (or stay intentionally public) in each handler.

Sign-up remains disabled (`disableSignUp: true`); only pre-created users can obtain a session. See [Auth: email allowlist + pre-created users](#auth-email-allowlist--pre-created-users) below.

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
- `src/routes/api/` — HTTP API server routes (`auth.$.ts` → `/api/auth/*`)
- `src/server/` — authenticated server functions (`session.ts`, `health.ts`)
