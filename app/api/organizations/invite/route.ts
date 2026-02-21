import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAction } from '@/lib/auth/guards';
import { sendEmail, createBrandedEmailTemplate } from '@/lib/email/resend';
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

    // Fetch gym and inviter information for email
    const { data: gym } = await adminClient
      .from('gyms')
      .select('name, sender_name, sender_email, logo_url, brand_primary_color, brand_secondary_color, resend_api_key')
      .eq('id', gymId)
      .single();

    const { data: inviter } = await adminClient
      .from('users')
      .select('full_name')
      .eq('id', userProfile.id)
      .single();

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join?token=${token}`;
    const gymName = gym?.name || 'the gym';
    const inviterName = inviter?.full_name || 'A team member';
    const roleLabel = role === 'coach' ? 'coach' : 'owner';

    // Build email content
    const emailContent = `Hi there,

${inviterName} has invited you to join ${gymName} as a ${roleLabel}.

Click the link below to accept your invitation:

${inviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The ${gymName} team`;

    // Send invite email
    // Use Resend's test domain if no sender_email is configured, or use gym's sender_email if verified
    const senderName = gym?.sender_name || gymName;
    const senderEmail = gym?.sender_email || 'onboarding@resend.dev';
    const from = `${senderName} <${senderEmail}>`;

    const emailBody = createBrandedEmailTemplate(emailContent, {
      logo_url: gym?.logo_url,
      brand_primary_color: gym?.brand_primary_color,
      brand_secondary_color: gym?.brand_secondary_color,
      gym_name: gymName,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: `You've been invited to join ${gymName}`,
      body: emailBody,
      from,
      apiKey: gym?.resend_api_key ?? undefined,
    });

    if (emailResult.error) {
      console.error('Failed to send invite email:', emailResult.error);
      console.error('Email details:', { to: email, from, subject: `You've been invited to join ${gymName}` });
      // Still return success since invite was created, but log the error
    } else {
      console.log('Invite email sent successfully:', emailResult.id);
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
        invite_link: inviteLink,
        email_sent: !emailResult.error,
        email_error: emailResult.error || null,
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
