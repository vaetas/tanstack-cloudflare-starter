import { createMiddleware, createServerFn } from "@tanstack/react-start";
import {
  getRequestHeaders,
  setResponseStatus,
} from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/auth-errors";

export { UnauthorizedError } from "@/lib/auth-errors";

export const getSessionFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const headers = getRequestHeaders();
    return auth.api.getSession({ headers });
  },
);

export const requireUserMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const session = await getSessionFn();
  if (!session?.user) {
    setResponseStatus(401);
    throw new UnauthorizedError();
  }

  return next({
    context: { session: session },
  });
});
