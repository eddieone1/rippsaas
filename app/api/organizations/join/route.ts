import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const joinSchema = z.object({
  token: z.string().min(1),
});

/**
 * POST /api/organizations/join
 * Accept an organization invite using token
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'You must be logged in to join an organization' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = joinSchema.parse(body);

    const adminClient = createAdminClient();

    // Find invite
    const { data: invite, error: inviteError } = await adminClient
      .from('organization_invites')
      .select('*, gyms(*)')
      .eq('token', token)
      .eq('email', user.email.toLowerCase())
      .is('accepted_at', null)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invite' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 400 }
      );
    }

    // Check if user already has a gym
    const { data: existingUser } = await adminClient
      .from('users')
      .select('gym_id')
      .eq('id', user.id)
      .single();

    if (existingUser?.gym_id) {
      return NextResponse.json(
        { error: 'You are already part of an organization' },
        { status: 400 }
      );
    }

    // Create user profile with role from invite
    const { error: userError } = await adminClient.from('users').insert({
      id: user.id,
      gym_id: invite.gym_id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      role: invite.role,
    });

    if (userError) {
      return NextResponse.json(
        { error: `Failed to join organization: ${userError.message}` },
        { status: 500 }
      );
    }

    // Mark invite as accepted
    await adminClient
      .from('organization_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    return NextResponse.json({
      success: true,
      gym: invite.gyms,
      role: invite.role,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Join error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
