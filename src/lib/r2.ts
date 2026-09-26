import { env } from "cloudflare:workers";

/** Get the R2 bucket for storing application files. */
export function getStorageBucket(): R2Bucket {
  return env.STORAGE;
}
