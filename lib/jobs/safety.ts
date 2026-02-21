/**
 * Cron job safety: auth, timeout wrapper, and execution logging.
 */

export function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${secret}`;
}

export interface SafeJobResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
  durationMs: number;
}

export async function runSafeJob<T>(
  name: string,
  fn: () => Promise<T>,
  options?: { timeoutMs?: number }
): Promise<SafeJobResult<T>> {
  const start = Date.now();
  const timeoutMs = options?.timeoutMs ?? 300000; // 5 min default
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Job ${name} timed out after ${timeoutMs}ms`)), timeoutMs)
    );
    const result = await Promise.race([fn(), timeoutPromise]);
    return { success: true, result, durationMs: Date.now() - start };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, error, durationMs: Date.now() - start };
  }
}

export function logJobExecution(name: string, result: SafeJobResult): void {
  const level = result.success ? 'info' : 'error';
  const msg = result.success
    ? `[cron] ${name} completed in ${result.durationMs}ms`
    : `[cron] ${name} failed: ${result.error} (${result.durationMs}ms)`;
  if (level === 'error') console.error(msg);
  else console.log(msg);
}
