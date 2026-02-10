import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAction } from '@/lib/auth/guards';

/**
 * GET /api/organizations/invites
 * Get pending invites for current user's email (for join flow)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Get pending invites for this email
    const { data: invites, error } = await supabase
      .from('organization_invites')
      .select('*, gyms(name), users!organization_invites_invited_by_fkey(full_name)')
      .eq('email', user.email.toLowerCase())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ invites: invites || [] });
  } catch (error) {
    console.error('Get invites error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
