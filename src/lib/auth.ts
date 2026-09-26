import { env } from "cloudflare:workers";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { bearer } from "better-auth/plugins/bearer";
import { emailOTP } from "better-auth/plugins/email-otp";
import { magicLink } from "better-auth/plugins/magic-link";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { drizzle } from "drizzle-orm/d1";
import { buildSignInEmail, sendEmail } from "./cloudflare-email";
import { createMagicLinkUrl } from "./magic-link-url";
import * as schema from "./schema";

function getAuthTrustedOrigins(): string[] {
  const origins = new Set<string>();

  if (process.env.APP_URL) {
    origins.add(new URL(process.env.APP_URL).origin);
  }

  // Cloudflare Vite plugin serves the worker preview on 8787 during local dev.
  if (process.env.APP_URL?.includes("localhost")) {
    origins.add("http://localhost:3000");
    origins.add("http://localhost:8787");
  }

  return [...origins];
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.APP_URL,
  trustedOrigins: getAuthTrustedOrigins(),
  emailAndPassword: { enabled: false },
  database: drizzleAdapter(drizzle(env.DB, { schema: schema }), {
    provider: "sqlite",
  }),
  plugins: [
    magicLink({
      // Existing users only — unknown emails cannot register via magic link.
      disableSignUp: true,
      sendMagicLink: async () => {
        // Combined sign-in emails are sent from emailOTP.sendVerificationOTP.
      },
    }),
    emailOTP({
      // Existing users only — unknown emails cannot register via OTP.
      //
      // On the free Cloudflare plan, Email Sending already requires every
      // destination to be allowlisted in the Cloudflare dashboard. Users must
      // also exist in D1 before sign-in works (see README).
      disableSignUp: true,
      async sendVerificationOTP({ email, otp, type }, ctx) {
        if (type !== "sign-in") return;
        if (!ctx) {
          throw new Error("Missing auth context for sign-in email");
        }

        const url = await createMagicLinkUrl(ctx, email, {
          callbackURL: "/",
          errorCallbackURL: "/",
        });

        const content = buildSignInEmail({ url, otp });
        await sendEmail({ to: email, ...content });
      },
    }),
    bearer(),
    tanstackStartCookies(),
  ],
});
