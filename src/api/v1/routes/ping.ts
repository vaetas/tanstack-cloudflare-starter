import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { type ApiAuthVariables, apiAuth } from "@/api/v1/middleware/auth";
import { errorResponseSchema, pingResponseSchema } from "@/api/v1/schemas";

const BEARER_SECURITY_SCHEME = "BearerAuth";

const pingApp = new OpenAPIHono<{ Variables: ApiAuthVariables }>();

pingApp.use("*", apiAuth);

const getPingRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["health"],
  summary: "Liveness check",
  description:
    "Returns server time when the caller presents a valid Better Auth session (cookie or bearer token).",
  security: [{ [BEARER_SECURITY_SCHEME]: [] }],
  responses: {
    200: {
      description: "Service is up.",
      content: {
        "application/json": { schema: pingResponseSchema },
      },
    },
    401: {
      description: "Invalid or missing authorization token or session.",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

pingApp.openapi(getPingRoute, (c) =>
  c.json(
    {
      ok: true as const,
      time: new Date().toISOString(),
    },
    200,
  ),
);

export default pingApp;
