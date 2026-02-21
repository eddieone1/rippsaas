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
    const birthdays = searchParams.get("birthdays");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));

    // Build query (include date_of_birth for birthday filter and display)
    let query = supabase
      .from("members")
      .select("*", { count: "exact" })
      .eq("gym_id", userProfile.gym_id);

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Filter by risk level
    if (risk && risk !== "all") {
      query = query.eq("churn_risk_level", risk);
    }

    // Search: use ilike for case-insensitive match (escape % and _)
    if (search && search.trim()) {
      const term = search.trim().replace(/[%_]/g, "\\$&");
      query = query.or(
        `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
      );
    }

    // Birthdays this month: filter by month in date string (YYYY-MM-DD format)
    if (birthdays === "this_month") {
      const thisMonth = (new Date().getMonth() + 1).toString().padStart(2, "0");
      query = query.not("date_of_birth", "is", null);
      query = query.like("date_of_birth", `%-${thisMonth}-%`);
    }

    // Order by risk score (highest first), then days inactive, then name
    query = query.order("churn_risk_score", { ascending: false });
    query = query.order("last_visit_date", { ascending: true, nullsFirst: false });
    query = query.order("last_name", { ascending: true });
    query = query.order("first_name", { ascending: true });

    // Paginate (count comes from same query)
    const offset = (page - 1) * limit;
    const { data: members, count: totalCount, error } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch members: ${error.message}` },
        { status: 500 }
      );
    }

    const total = totalCount ?? (members?.length ?? 0);

    return NextResponse.json({
      success: true,
      members: members ?? [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
