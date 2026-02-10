import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * API endpoint to fetch intervention performance metrics
 * MVP-level reporting: Simple metrics without complex attribution
 * 
 * Returns:
 * - Total sent per template/campaign
 * - Total re-engaged per template/campaign
 * - Success rate (%)
 * - Average days to return
 * 
 * MVP Limitation: Multiple interventions to same member may overlap.
 * We use simple "last intervention wins" attribution.
 */
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
    const timeRange = searchParams.get("time_range") || "all"; // all, month, quarter, year

    // Build date filter
    let dateFilter: Date | null = null;
    if (timeRange === "month") {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (timeRange === "quarter") {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 3);
    } else if (timeRange === "year") {
      dateFilter = new Date();
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    }

    // Fetch campaign sends with campaign and template details
    let query = supabase
      .from("campaign_sends")
      .select(
        `
        id,
        sent_at,
        outcome,
        days_to_return,
        channel,
        campaigns!inner (
          id,
          name,
          trigger_days,
          template_id,
          campaign_templates!inner (
            id,
            name,
            subject
          )
        )
      `
      )
      .eq("campaigns.gym_id", userProfile.gym_id);

    if (dateFilter) {
      query = query.gte("sent_at", dateFilter.toISOString());
    }

    const { data: sends, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch intervention data: ${error.message}` },
        { status: 500 }
      );
    }

    // Aggregate by template (MVP: simple grouping)
    const templateStats: Record<
      string,
      {
        template_id: string;
        template_name: string;
        campaign_name: string;
        channel: string;
        total_sent: number;
        total_re_engaged: number;
        total_no_response: number;
        total_cancelled: number;
        days_to_return: number[];
      }
    > = {};

    sends?.forEach((send: any) => {
      const templateId = send.campaigns?.template_id || "unknown";
      const templateName = send.campaigns?.campaign_templates?.name || "Unknown Template";
      const campaignName = send.campaigns?.name || "Unknown Campaign";
      const channel = send.channel || "unknown";

      if (!templateStats[templateId]) {
        templateStats[templateId] = {
          template_id: templateId,
          template_name: templateName,
          campaign_name: campaignName,
          channel: channel,
          total_sent: 0,
          total_re_engaged: 0,
          total_no_response: 0,
          total_cancelled: 0,
          days_to_return: [],
        };
      }

      templateStats[templateId].total_sent++;
      
      if (send.outcome === "re_engaged") {
        templateStats[templateId].total_re_engaged++;
        if (send.days_to_return !== null && send.days_to_return !== undefined) {
          templateStats[templateId].days_to_return.push(send.days_to_return);
        }
      } else if (send.outcome === "no_response") {
        templateStats[templateId].total_no_response++;
      } else if (send.outcome === "cancelled") {
        templateStats[templateId].total_cancelled++;
      }
    });

    // Calculate metrics for each template
    const performance = Object.values(templateStats).map((stats) => {
      const successRate =
        stats.total_sent > 0
          ? Math.round((stats.total_re_engaged / stats.total_sent) * 100)
          : 0;

      const avgDaysToReturn =
        stats.days_to_return.length > 0
          ? Math.round(
              stats.days_to_return.reduce((a, b) => a + b, 0) /
                stats.days_to_return.length
            )
          : null;

      return {
        ...stats,
        success_rate: successRate,
        avg_days_to_return: avgDaysToReturn,
      };
    });

    // Sort by total sent (most used first)
    performance.sort((a, b) => b.total_sent - a.total_sent);

    // Find fastest and highest performing
    const fastest = performance
      .filter((p) => p.avg_days_to_return !== null)
      .sort((a, b) => (a.avg_days_to_return || 999) - (b.avg_days_to_return || 999))[0];

    const highestPerforming = performance
      .filter((p) => p.total_sent >= 5) // Only consider templates with at least 5 sends
      .sort((a, b) => b.success_rate - a.success_rate)[0];

    return NextResponse.json({
      success: true,
      performance,
      insights: {
        fastest_to_bring_back: fastest || null,
        highest_performing: highestPerforming || null,
      },
      time_range: timeRange,
    });
  } catch (error) {
    console.error("Get intervention performance error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
