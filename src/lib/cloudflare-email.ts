import { env } from "cloudflare:workers";
import { getEmailFrom } from "./email-from";

type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(message: OutboundEmail): Promise<void> {
  await env.EMAIL.send({
    from: { email: getEmailFrom(), name: "Starter" },
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

export function buildSignInEmail({
  url,
  otp,
}: {
  url: string;
  otp: string;
}): Pick<OutboundEmail, "subject" | "text" | "html"> {
  return {
    subject: "Sign in to Starter",
    text: [
      "Sign in to Starter using either option below:",
      "",
      `Sign-in code: ${otp}`,
      "",
      "Or click this link:",
      url,
      "",
      "Both expire in 5 minutes. If you didn't request this, you can ignore this email.",
    ].join("\n"),
    html: [
      "<p>Sign in to Starter using either option below:</p>",
      `<p>Sign-in code: <strong>${otp}</strong></p>`,
      `<p><a href="${url}">Sign in with magic link</a></p>`,
      "<p>Both expire in 5 minutes. If you didn't request this, you can ignore this email.</p>",
    ].join(""),
  };
}
