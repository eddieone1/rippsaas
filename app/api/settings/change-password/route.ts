import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { validatePassword } from "@/lib/password-rules";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { new_password } = await request.json();

    const passwordCheck = validatePassword(new_password ?? "");
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.message ?? "Password does not meet requirements" },
        { status: 400 }
      );
    }

    const { error } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to update password" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
