import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getStorageBucket } from "@/lib/r2";
import { requireUserMiddleware } from "@/server/session";

export const checkBindingsFn = createServerFn({ method: "GET" })
  .middleware([requireUserMiddleware])
  .handler(async () => {
    await env.DB.prepare("SELECT 1").first();

    const bucket = getStorageBucket();
    // head returns null when the key is missing — that still proves the binding works
    await bucket.head("__starter_health_check__");

    return {
      d1: true,
      r2: true,
    };
  });
