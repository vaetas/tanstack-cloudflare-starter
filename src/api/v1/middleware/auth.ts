import type { Session } from "better-auth";
import type { Context, Next } from "hono";

export type ApiAuthVariables = {
  userId: string;
  session: NonNullable<Session>;
};

const UNAUTHORIZED_RESPONSE = {
  error: "Invalid or missing authorization token or session",
} as const;

/**
 * Requires a Better Auth session via session cookie or `Authorization: Bearer`.
 */
export async function apiAuth(c: Context, next: Next) {
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json(UNAUTHORIZED_RESPONSE, 401);
  }

  c.set("userId" as never, session.user.id as never);
  c.set("session" as never, session as never);
  await next();
}
