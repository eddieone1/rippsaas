import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAction } from '@/lib/auth/guards';
import { z } from 'zod';
import crypto from 'crypto';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'coach']).default('coach'),
});

/**
 * POST /api/organizations/invite
 * Create an organization invite (owner only)
 */
export async function POST(request: Request) {
  try {
    // Check permissions
    const { userProfile, gymId } = await requireAction('invite_users');

    const body = await request.json();
    const { email, role } = inviteSchema.parse(body);

    const adminClient = createAdminClient();

    // Generate invite token (32 bytes hex = 64 characters)
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invite
    const { data: invite, error: inviteError } = await adminClient
      .from('organization_invites')
      .insert({
        gym_id: gymId,
        email: email.toLowerCase(),
        role,
        invited_by: userProfile.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 400 }
      );
    }

    // TODO: Send invite email with token
    // For now, return the invite token (remove in production)
    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
        invite_link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join?token=${token}`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Invite error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
