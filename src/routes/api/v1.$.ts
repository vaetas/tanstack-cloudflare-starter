import { createFileRoute } from "@tanstack/react-router";
import app from "@/api/v1";

/**
 * Splat route that forwards every `/api/v1/*` request to the versioned Hono
 * OpenAPI app in `src/api/v1/index.ts`.
 *
 * `/api/v1/ping`, `/api/v1/openapi.json`, and `/api/v1/docs` (Scalar) are
 * served by Hono. Better Auth remains at `/api/auth/*` via `auth.$.ts`.
 */
const serve = ({ request }: { request: Request }) => app.fetch(request);

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      GET: serve,
      POST: serve,
      PUT: serve,
      PATCH: serve,
      DELETE: serve,
      OPTIONS: serve,
      HEAD: serve,
    },
  },
});
