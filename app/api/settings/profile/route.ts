import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return handleProfileUpdate(request);
}

export async function PUT(request: Request) {
  return handleProfileUpdate(request);
}

async function handleProfileUpdate(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    } = await request.json();

    // gymName and fullName are optional for branding updates
    if (gymName !== undefined && !gymName) {
      return NextResponse.json(
        { error: "Gym name cannot be empty" },
        { status: 400 }
      );
    }
    if (fullName !== undefined && !fullName) {
      return NextResponse.json(
        { error: "Full name cannot be empty" },
        { status: 400 }
      );
    }

    // Get user's gym_id
    const { data: userProfile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!userProfile?.gym_id) {
      return NextResponse.json(
        { error: "Gym not found" },
        { status: 404 }
      );
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

    const { error: gymError } = await supabase
      .from("gyms")
      .update(gymUpdate)
      .eq("id", userProfile.gym_id);

    if (gymError) {
      return NextResponse.json(
        { error: `Failed to update gym: ${gymError.message}` },
        { status: 500 }
      );
    }

    // Update user profile only if fullName is provided
    if (fullName !== undefined) {
      const { error: userError } = await supabase
        .from("users")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (userError) {
        return NextResponse.json(
          { error: `Failed to update user profile: ${userError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
