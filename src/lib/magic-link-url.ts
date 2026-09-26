import type { GenericEndpointContext } from "@better-auth/core";
import { generateRandomString } from "better-auth/crypto";

const MAGIC_LINK_EXPIRES_SEC = 5 * 60;

export async function createMagicLinkUrl(
  ctx: GenericEndpointContext,
  email: string,
  {
    callbackURL = "/",
    errorCallbackURL = "/",
  }: {
    callbackURL?: string;
    errorCallbackURL?: string;
  } = {},
): Promise<string> {
  const verificationToken = generateRandomString(32, "a-z", "A-Z");

  await ctx.context.internalAdapter.createVerificationValue({
    identifier: verificationToken,
    value: JSON.stringify({ email }),
    expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRES_SEC * 1000),
  });

  const realBaseURL = new URL(ctx.context.baseURL);
  const pathname = realBaseURL.pathname === "/" ? "" : realBaseURL.pathname;
  const basePath = pathname ? "" : ctx.context.options.basePath || "";
  const url = new URL(
    `${pathname}${basePath}/magic-link/verify`,
    realBaseURL.origin,
  );
  url.searchParams.set("token", verificationToken);
  url.searchParams.set("callbackURL", callbackURL);
  url.searchParams.set("errorCallbackURL", errorCallbackURL);

  return url.toString();
}
