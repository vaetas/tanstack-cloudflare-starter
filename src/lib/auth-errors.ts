export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized, please login");
    this.name = "UnauthorizedError";
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  return (
    error instanceof UnauthorizedError ||
    (error instanceof Error && error.message === "Unauthorized, please login")
  );
}
