import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { z } from 'zod';

const syncSchema = z.object({
  provider: z.enum(['mindbody', 'glofox']),
  syncVisits: z.boolean().default(true),
  calculateRiskScores: z.boolean().default(true),
  since: z.string().optional(), // ISO date string
  dryRun: z.boolean().default(false),
});

/**
 * POST /api/sync/members
 * Sync members from external gym software (Mindbody, Glofox)
 *
 * Requires @/lib/integrations/sync-service and adapters to be implemented.
 */
export async function POST(request: Request) {
  try {
    const { userProfile, gymId } = await requireAuth();

    if (userProfile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can sync members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    syncSchema.parse(body);

    return NextResponse.json(
      {
        error: 'Sync not configured',
        message: 'Member sync integrations (sync-service, mindbody-adapter, glofox-adapter) are not implemented yet.',
      },
      { status: 501 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/members
 * Get sync status/history (future enhancement)
 */
export async function GET(request: Request) {
  try {
    const { userProfile, gymId } = await requireAuth();

    return NextResponse.json({
      message: 'Sync status endpoint - to be implemented',
      gymId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
