export function getEmailFrom(): string {
  const value = process.env.EMAIL_FROM?.trim();
  if (!value) {
    throw new Error("EMAIL_FROM is not configured");
  }
  return value;
}
