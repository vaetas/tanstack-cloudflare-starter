import { z } from "@hono/zod-openapi";

/**
 * Shared OpenAPI request/response schemas for the versioned HTTP API.
 * Import `z` from `@hono/zod-openapi` so schemas are registered in the spec.
 */

export const pingResponseSchema = z
  .object({
    ok: z.literal(true),
    time: z.string().datetime().openapi({
      description: "Server time in ISO 8601 format.",
      example: "2026-01-01T12:00:00.000Z",
    }),
  })
  .openapi("PingResponse");

export type PingResponse = z.infer<typeof pingResponseSchema>;

export const errorResponseSchema = z
  .object({
    error: z.string().openapi({ example: "Unauthorized" }),
    details: z.unknown().optional().openapi({
      description: "Additional structured details, e.g. validation issues.",
    }),
  })
  .openapi("ErrorResponse");

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
