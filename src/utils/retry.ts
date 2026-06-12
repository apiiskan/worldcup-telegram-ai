import { logger } from "./logger.js";

export async function retry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 3,
  delayMs = 2000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      logger.warn({ attempt, maxAttempts, err }, `${label} failed (attempt ${attempt}/${maxAttempts})`);
      if (attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
  throw new Error("unreachable");
}
