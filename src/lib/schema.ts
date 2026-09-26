/**
 * Drizzle schema for this starter.
 *
 * Better Auth tables live in auth-schema.ts. Re-export them here so
 * drizzle-kit and the D1 adapter share one entry point.
 *
 * After changing this file, run `bun run db:generate`. Apply migrations
 * yourself with `bun run db:migrate:local` or `bun run db:migrate:remote`.
 */

export {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "auth-schema";
