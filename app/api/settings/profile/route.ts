import { createClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth/guards";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/api/response";

export async function POST(request: Request) {
  return handleProfileUpdate(request);
}

export async function PUT(request: Request) {
  return handleProfileUpdate(request);
}

async function handleProfileUpdate(request: Request) {
  try {
    const { userProfile, gymId } = await requireApiAuth();
    const supabase = await createClient();

    const {
      gymName,
      fullName,
      address_line1,
      address_line2,
      city,
      postcode,
      country,
      latitude,
      longitude,
      logo_url,
      brand_primary_color,
      brand_secondary_color,
      sender_name,
      sender_email,
      sms_from_number,
      resend_api_key,
      twilio_account_sid,
      twilio_auth_token,
      mindbody_api_key,
      mindbody_site_id,
      mindbody_access_token,
      glofox_access_token,
      glofox_base_url,
    } = await request.json();

    // gymName and fullName are optional for branding updates
    if (gymName !== undefined && !gymName) {
      return errorResponse("Gym name cannot be empty", 400);
    }
    if (fullName !== undefined && !fullName) {
      return errorResponse("Full name cannot be empty", 400);
    }

    // Update gym with address, branding, and sender identity
    const gymUpdate: {
      name?: string;
      address_line1?: string | null;
      address_line2?: string | null;
      city?: string | null;
      postcode?: string | null;
      country?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      logo_url?: string | null;
      brand_primary_color?: string | null;
      brand_secondary_color?: string | null;
      sender_name?: string | null;
      sender_email?: string | null;
      sms_from_number?: string | null;
      resend_api_key?: string | null;
      twilio_account_sid?: string | null;
      twilio_auth_token?: string | null;
      mindbody_api_key?: string | null;
      mindbody_site_id?: string | null;
      mindbody_access_token?: string | null;
      glofox_access_token?: string | null;
      glofox_base_url?: string | null;
    } = {};

    // Only update fields that are provided
    if (gymName !== undefined) gymUpdate.name = gymName;
    if (address_line1 !== undefined) gymUpdate.address_line1 = address_line1 || null;
    if (address_line2 !== undefined) gymUpdate.address_line2 = address_line2 || null;
    if (city !== undefined) gymUpdate.city = city || null;
    if (postcode !== undefined) gymUpdate.postcode = postcode || null;
    if (country !== undefined) gymUpdate.country = country || null;
    if (latitude !== undefined) gymUpdate.latitude = latitude || null;
    if (longitude !== undefined) gymUpdate.longitude = longitude || null;
    if (logo_url !== undefined) gymUpdate.logo_url = logo_url || null;
    if (brand_primary_color !== undefined) gymUpdate.brand_primary_color = brand_primary_color || null;
    if (brand_secondary_color !== undefined) gymUpdate.brand_secondary_color = brand_secondary_color || null;
    if (sender_name !== undefined) gymUpdate.sender_name = sender_name || null;
    if (sender_email !== undefined) gymUpdate.sender_email = sender_email || null;
    if (sms_from_number !== undefined) gymUpdate.sms_from_number = sms_from_number || null;
    if (resend_api_key !== undefined) gymUpdate.resend_api_key = resend_api_key?.trim() || null;
    if (twilio_account_sid !== undefined) gymUpdate.twilio_account_sid = twilio_account_sid?.trim() || null;
    if (twilio_auth_token !== undefined) gymUpdate.twilio_auth_token = twilio_auth_token?.trim() || null;
    if (mindbody_api_key !== undefined) gymUpdate.mindbody_api_key = mindbody_api_key?.trim() || null;
    if (mindbody_site_id !== undefined) gymUpdate.mindbody_site_id = mindbody_site_id?.trim() || null;
    if (mindbody_access_token !== undefined) gymUpdate.mindbody_access_token = mindbody_access_token?.trim() || null;
    if (glofox_access_token !== undefined) gymUpdate.glofox_access_token = glofox_access_token?.trim() || null;
    if (glofox_base_url !== undefined) gymUpdate.glofox_base_url = glofox_base_url?.trim() || null;

    const { error: gymError } = await supabase
      .from("gyms")
      .update(gymUpdate)
      .eq("id", gymId);

    if (gymError) {
      return errorResponse(`Failed to update gym: ${gymError.message}`, 500);
    }

    // Update user profile only if fullName is provided
    if (fullName !== undefined) {
      const { error: userError } = await supabase
        .from("users")
        .update({ full_name: fullName })
        .eq("id", userProfile.id);

      if (userError) {
        return errorResponse(
          `Failed to update user profile: ${userError.message}`,
          500
        );
      }
    }

    return successResponse();
  } catch (error) {
    return handleApiError(error, "Profile update error");
  }
}
