import { NextResponse } from 'next/server';
import { generateAllCoachActions } from '@/lib/jobs/coach-actions';
import { verifyCronAuth, runSafeJob, logJobExecution } from '@/lib/jobs/safety';

/**
 * POST /api/cron/coach-actions
 * 
 * Daily job to generate coach actions for all coaches.
 * Creates actions for today based on assigned members.
 * 
 * Schedule: Daily at 4 AM UTC
 * 
 * Safety:
 * - Requires CRON_SECRET authorization
 * - Only creates actions if they don't already exist (idempotent)
 * - Continues on individual coach errors
 * - Logs execution results
 */
export async function POST(request: Request) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Run job with safety wrapper
  const result = await runSafeJob(
    'coach-actions-generation',
    async () => {
      return await generateAllCoachActions();
    },
    {
      timeoutMs: 600000, // 10 minutes timeout
    }
  );

  // Log execution
  logJobExecution('coach-actions-generation', result);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        durationMs: result.durationMs,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    ...result.result,
    durationMs: result.durationMs,
  });
}

// Also support GET for manual testing (with auth check)
export async function GET(request: Request) {
  // In production, only allow POST from Vercel Cron
  // GET is for manual testing only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Method not allowed in production' },
      { status: 405 }
    );
  }

  return POST(request);
}
