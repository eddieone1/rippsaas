import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { SyncService } from '@/lib/integrations/sync-service';
import { createMindbodyAdapter } from '@/lib/integrations/mindbody-adapter';
import { createGlofoxAdapter } from '@/lib/integrations/glofox-adapter';
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
 * This is a READ-ONLY sync - we don't write back to external systems.
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const { userProfile, gymId } = await requireAuth();

    // Only owners can trigger syncs
    if (userProfile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can sync members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { provider, syncVisits, calculateRiskScores, since, dryRun } = 
      syncSchema.parse(body);

    // Create appropriate adapter
    let adapter;
    switch (provider) {
      case 'mindbody':
        adapter = createMindbodyAdapter({
          // In production, these would come from gym settings
          apiKey: process.env.MINDBODY_API_KEY,
          apiSecret: process.env.MINDBODY_API_SECRET,
        });
        break;
      case 'glofox':
        adapter = createGlofoxAdapter({
          // In production, these would come from gym settings
          apiKey: process.env.GLOFOX_API_KEY,
          businessId: process.env.GLOFOX_BUSINESS_ID,
        });
        break;
      default:
        return NextResponse.json(
          { error: `Unknown provider: ${provider}` },
          { status: 400 }
        );
    }

    // Create sync service
    const syncService = new SyncService(adapter, gymId);

    // Sync members
    const memberSummary = await syncService.syncMembers({
      since,
      dryRun,
      calculateRiskScores: false, // Calculate after visits sync
    });

    // Sync visits if requested
    let visitSummary = null;
    if (syncVisits) {
      visitSummary = await syncService.syncVisits({
        since,
        dryRun,
      });
    }

    // Calculate risk scores if requested (after visits are synced)
    if (calculateRiskScores && !dryRun) {
      await syncService.calculateRiskScores();
    }

    return NextResponse.json({
      success: true,
      provider,
      dryRun,
      members: memberSummary,
      visits: visitSummary,
      message: dryRun 
        ? 'Dry run completed - no data was saved'
        : 'Sync completed successfully',
    });
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
        message: error instanceof Error ? error.message : 'Unknown error'
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

    // Return sync status
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
