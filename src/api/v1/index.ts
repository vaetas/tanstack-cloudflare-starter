import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import pingApp from "@/api/v1/routes/ping";

/**
 * API version surfaced in the generated OpenAPI document. Bump this when the
 * public contract changes in a way clients should track.
 */
const API_VERSION = "1.0.0";
const API_DOCS_TITLE = "Starter API Docs";
const BEARER_SECURITY_SCHEME = "BearerAuth";

const API_DOCS_DESCRIPTION = `HTTP API for the TanStack Cloudflare starter.

[Back to the app](/)

## Authenticate before trying endpoints

Send either:

1. **Session cookie** — issued by Better Auth after email OTP / magic-link sign-in in the browser.
2. **Bearer token** — \`Authorization: Bearer <token>\` from Better Auth (email OTP sign-in).

Without valid credentials, endpoints return \`401 Invalid or missing authorization token or session\`.

Sign-in and session management live under \`/api/auth/*\` (not listed in this document).`;

/**
 * Versioned Hono OpenAPI app.
 *
 * Mounted under `/api/v1` via `src/routes/api/v1.$.ts`, which forwards every
 * request to `app.fetch`.
 *
 * The `basePath("/api/v1")` bakes `/api/v1` into every route and into the
 * generated OpenAPI `paths` (e.g. `/api/v1/ping`). The OpenAPI `servers` entry
 * is `{ url: "/" }` so Scalar resolves paths against the request origin.
 *
 * Adding a new endpoint:
 *   1. Create `src/api/v1/routes/<name>.ts` exporting a default `OpenAPIHono`
 *      sub-app with `createRoute` handlers.
 *   2. Mount it here with `app.route("/<name>", <subApp>)`.
 *   3. Reuse schemas from `src/api/v1/schemas.ts`.
 */
const app = new OpenAPIHono().basePath("/api/v1");

app.openAPIRegistry.registerComponent(
  "securitySchemes",
  BEARER_SECURITY_SCHEME,
  {
    type: "http",
    scheme: "bearer",
    description:
      "Better Auth session token from email OTP / magic-link sign-in (set-auth-token response header).",
  },
);

app.route("/ping", pingApp);

/**
 * Auto-generated OpenAPI document at `/api/v1/openapi.json`.
 */
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: API_DOCS_TITLE,
    version: API_VERSION,
    description: API_DOCS_DESCRIPTION,
  },
  servers: [{ url: "/", description: "Same-origin API root" }],
  security: [{ [BEARER_SECURITY_SCHEME]: [] }],
});

/**
 * Interactive API docs at `/api/v1/docs` (Scalar).
 */
app.get(
  "/docs",
  Scalar({
    url: "/api/v1/openapi.json",
    pageTitle: API_DOCS_TITLE,
    title: API_DOCS_TITLE,
    metaData: {
      title: API_DOCS_TITLE,
      description:
        "Interactive API reference. Set Bearer token in Authentication before testing endpoints.",
    },
    theme: "kepler",
    layout: "classic",
    defaultHttpClient: { targetKey: "js", clientKey: "fetch" },
    persistAuth: true,
    authentication: {
      preferredSecurityScheme: BEARER_SECURITY_SCHEME,
      securitySchemes: {
        [BEARER_SECURITY_SCHEME]: {
          name: "Authorization",
          in: "header",
        },
      },
    },
  }),
);

export type AppType = typeof app;
export default app;
