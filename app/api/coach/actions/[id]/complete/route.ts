import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const completeSchema = z.object({
  notes: z.string().optional(),
});

/**
 * POST /api/coach/actions/[id]/complete
 * 
 * Mark an action as complete
 * Records completion timestamp and optional notes
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { userProfile } = await requireAuth();

    // Only coaches can complete their own actions
    if (userProfile.role !== 'coach') {
      return NextResponse.json(
        { error: 'Only coaches can complete actions' },
        { status: 403 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const actionId = resolvedParams.id;

    const body = await request.json();
    const { notes } = completeSchema.parse(body);

    const adminClient = createAdminClient();

    // Verify action belongs to this coach
    const { data: action } = await adminClient
      .from('coach_actions')
      .select('id, coach_id, completed_at')
      .eq('id', actionId)
      .eq('coach_id', userProfile.id)
      .single();

    if (!action) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    if (action.completed_at) {
      return NextResponse.json({
        success: true,
        message: 'Action already completed',
      });
    }

    // Mark as complete
    const { error: updateError } = await adminClient
      .from('coach_actions')
      .update({
        completed_at: new Date().toISOString(),
        completed_by: userProfile.id,
        notes: notes || null,
      })
      .eq('id', actionId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to complete action: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Action marked as complete',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Complete action error:', error);
    return NextResponse.json(
      { error: 'Failed to complete action' },
      { status: 500 }
    );
  }
}
