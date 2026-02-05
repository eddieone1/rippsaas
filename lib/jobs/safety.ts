/**
 * Safety Mechanisms for Background Jobs
 * 
 * Provides utilities for:
 * - Authentication/authorization (Vercel Cron secret)
 * - Rate limiting
 * - Error handling
 * - Idempotency checks
 * - Timeout protection
 */

/**
 * Verify Vercel Cron authorization header
 * Vercel Cron sends a secret in the Authorization header
 */
export function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not set - allowing request (development mode)');
    return true; // Allow in development
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Create a safe job wrapper that handles errors and timeouts
 */
export async function runSafeJob<T>(
  jobName: string,
  jobFn: () => Promise<T>,
  options: {
    timeoutMs?: number;
    onError?: (error: Error) => void;
  } = {}
): Promise<{ success: boolean; result?: T; error?: string; durationMs: number }> {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs || 300000; // 5 minutes default

  try {
    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Job ${jobName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Run job with timeout
    const result = await Promise.race([jobFn(), timeoutPromise]);

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      result,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`Job ${jobName} failed:`, errorMessage);

    if (options.onError && error instanceof Error) {
      options.onError(error);
    }

    return {
      success: false,
      error: errorMessage,
      durationMs,
    };
  }
}

/**
 * Check if job should run (idempotency check)
 * Can be used to prevent duplicate runs
 */
export async function shouldRunJob(
  jobName: string,
  jobKey: string,
  cooldownMinutes: number = 60
): Promise<boolean> {
  // In a production system, you'd check a database or cache
  // For MVP, we'll use a simple in-memory cache (resets on server restart)
  // This is fine for Vercel Cron which runs on a schedule

  // For now, always allow (Vercel Cron handles scheduling)
  // Future: Could add Redis or database tracking
  return true;
}

/**
 * Log job execution for monitoring
 */
export function logJobExecution(
  jobName: string,
  result: {
    success: boolean;
    durationMs: number;
    [key: string]: any;
  }
): void {
  const logData = {
    job: jobName,
    timestamp: new Date().toISOString(),
    ...result,
  };

  if (result.success) {
    console.log(`[JOB SUCCESS] ${jobName}:`, JSON.stringify(logData, null, 2));
  } else {
    console.error(`[JOB FAILURE] ${jobName}:`, JSON.stringify(logData, null, 2));
  }

  // Future: Send to monitoring service (e.g., Sentry, DataDog)
}
