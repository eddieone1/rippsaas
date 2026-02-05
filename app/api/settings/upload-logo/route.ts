import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const formData = await request.formData();
    const logoFile = formData.get("logo") as File;

    if (!logoFile) {
      return NextResponse.json(
        { error: "No logo file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!logoFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (2MB max)
    if (logoFile.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 2MB" },
        { status: 400 }
      );
    }

    // Convert file to base64 for storage
    // In production, you'd want to use Supabase Storage or another file storage service
    const arrayBuffer = await logoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${logoFile.type};base64,${base64}`;

    // For MVP, we'll store the base64 data URL directly in the database
    // In production, upload to Supabase Storage and store the URL
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from("gyms")
      .update({ logo_url: dataUrl })
      .eq("id", userProfile.gym_id);

    if (updateError) {
      console.error("Error updating logo:", updateError);
      return NextResponse.json(
        { error: `Failed to save logo: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logo_url: dataUrl,
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
