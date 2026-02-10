import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const risk = searchParams.get("risk");
    const search = searchParams.get("search");

    // Build query
    let query = supabase
      .from("members")
      .select("*")
      .eq("gym_id", userProfile.gym_id);

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Filter by risk level
    if (risk && risk !== "all") {
      query = query.eq("churn_risk_level", risk);
    }

    // Order by risk score (highest first) and then by name
    query = query.order("churn_risk_score", { ascending: false });
    query = query.order("last_name", { ascending: true });
    query = query.order("first_name", { ascending: true });

    const { data: members, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch members: ${error.message}` },
        { status: 500 }
      );
    }

    // Apply search filter if provided (server-side for better performance)
    let filteredMembers = members || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMembers = filteredMembers.filter(
        (member) =>
          member.first_name?.toLowerCase().includes(searchLower) ||
          member.last_name?.toLowerCase().includes(searchLower) ||
          member.email?.toLowerCase().includes(searchLower) ||
          member.phone?.includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      members: filteredMembers,
      total: filteredMembers.length,
    });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
