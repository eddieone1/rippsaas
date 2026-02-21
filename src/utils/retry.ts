/**
 * Retry with exponential backoff for failed requests.
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryableStatuses?: number[];
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "retryableStatuses">> & {
  retryableStatuses: number[];
} = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs, retryableStatuses } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err && typeof err === "object" && "status" in err ? (err as { status: number }).status : undefined;
      const isRetryable =
        status !== undefined
          ? retryableStatuses.includes(status)
          : true; // retry network errors etc.
      if (attempt === maxAttempts || !isRetryable) throw err;
      const backoff = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      await delay(backoff);
    }
  }
  throw lastError;
}
