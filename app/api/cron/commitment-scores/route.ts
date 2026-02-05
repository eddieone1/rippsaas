import { NextResponse } from 'next/server';
import { recalculateAllCommitmentScores } from '@/lib/jobs/commitment-scores';
import { verifyCronAuth, runSafeJob, logJobExecution } from '@/lib/jobs/safety';

/**
 * POST /api/cron/commitment-scores
 * 
 * Daily job to recalculate commitment scores for all active members.
 * 
 * Schedule: Daily at 2 AM UTC
 * 
 * Safety:
 * - Requires CRON_SECRET authorization
 * - Processes in batches to avoid overwhelming database
 * - Continues on individual member errors
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
    'commitment-scores-recalculation',
    async () => {
      return await recalculateAllCommitmentScores();
    },
    {
      timeoutMs: 600000, // 10 minutes timeout
    }
  );

  // Log execution
  logJobExecution('commitment-scores-recalculation', result);

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
