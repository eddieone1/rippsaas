import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("email, full_name, phone")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      email: profile?.email ?? user.email ?? "",
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
    });
  } catch (error) {
    console.error("Get me error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, full_name, phone } = body;

    if (full_name !== undefined) {
      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: typeof full_name === "string" ? full_name.trim() : full_name,
          ...(phone !== undefined && { phone: phone === "" ? null : phone }),
        })
        .eq("id", user.id);

      if (userError) {
        return NextResponse.json(
          { error: `Failed to update profile: ${userError.message}` },
          { status: 500 }
        );
      }
    }

    if (email !== undefined && email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: email.trim(),
      });
      if (authError) {
        return NextResponse.json(
          { error: authError.message || "Failed to update email" },
          { status: 400 }
        );
      }
      await supabase
        .from("users")
        .update({ email: email.trim() })
        .eq("id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update me error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
