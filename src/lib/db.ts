import { env } from "cloudflare:workers";
import { createMiddleware } from "@tanstack/react-start";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type AppDb = DrizzleD1Database<typeof schema>;

export const dbMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    return next({
      context: {
        db: drizzle(env.DB, { schema: schema }),
      },
    });
  },
);
