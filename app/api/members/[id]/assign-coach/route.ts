import { NextResponse } from 'next/server';
import { requireAction } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const assignSchema = z.object({
  coachId: z.string().uuid(),
});

/**
 * POST /api/members/[id]/assign-coach
 * 
 * Assign or reassign a coach to a member
 * Only owners can assign coaches
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Only owners can assign coaches
    const { userProfile, gymId } = await requireAction('invite_users');
    
    const resolvedParams = await Promise.resolve(params);
    const memberId = resolvedParams.id;

    const body = await request.json();
    const { coachId } = assignSchema.parse(body);

    const adminClient = createAdminClient();

    // Verify member belongs to gym
    const { data: member } = await adminClient
      .from('members')
      .select('gym_id')
      .eq('id', memberId)
      .eq('gym_id', gymId)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Verify coach belongs to gym and is a coach
    const { data: coach } = await adminClient
      .from('users')
      .select('id, role, gym_id')
      .eq('id', coachId)
      .eq('gym_id', gymId)
      .eq('role', 'coach')
      .single();

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found or invalid' },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const { data: existingAssignment } = await adminClient
      .from('member_coaches')
      .select('id')
      .eq('member_id', memberId)
      .eq('coach_id', coachId)
      .maybeSingle();

    if (existingAssignment) {
      return NextResponse.json({
        success: true,
        message: 'Coach already assigned',
      });
    }

    // Remove existing assignment (if any) - one coach per member
    await adminClient
      .from('member_coaches')
      .delete()
      .eq('member_id', memberId);

    // Create new assignment
    const { error: assignError } = await adminClient
      .from('member_coaches')
      .insert({
        member_id: memberId,
        coach_id: coachId,
        assigned_by: userProfile.id,
      });

    if (assignError) {
      return NextResponse.json(
        { error: `Failed to assign coach: ${assignError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coach assigned successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Assign coach error:', error);
    return NextResponse.json(
      { error: 'Failed to assign coach' },
      { status: 500 }
    );
  }
}
