import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/members/[id]
 * Update member details: email, phone, special_notes
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { gymId } = await requireAuth();
    const resolvedParams = await Promise.resolve(params);
    const memberId = resolvedParams.id;

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.email === 'string') updates.email = body.email.trim() || null;
    if (typeof body.phone === 'string') updates.phone = body.phone.trim() || null;
    if (typeof body.special_notes === 'string') updates.special_notes = body.special_notes.trim() || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', memberId)
      .eq('gym_id', gymId)
      .select('id, email, phone, special_notes')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Member not found' },
        { status: error?.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Member update error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
