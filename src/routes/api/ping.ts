import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ping")({
  server: {
    handlers: {
      GET: () =>
        Response.json({
          ok: true,
          time: new Date().toISOString(),
        }),
    },
  },
});
