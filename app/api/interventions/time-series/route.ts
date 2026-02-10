import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * API endpoint to fetch time-series data for visual charts
 * Returns metrics grouped by time period (daily, weekly, monthly)
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
    const timeRange = searchParams.get("time_range") || "all";
    const groupBy = searchParams.get("group_by") || "month"; // day, week, month

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
    } else {
      // All time - go back 12 months for charts
      dateFilter = new Date();
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    }

    // Get campaign IDs for this gym
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id")
      .eq("gym_id", userProfile.gym_id);

    const campaignIds = campaigns?.map((c) => c.id) || [];

    // Monthly churn: inactive + cancelled; churn month = last_visit_date (or updated_at for cancelled if no last_visit_date). Recalculated from current member data.
    const { data: allMembers } = await supabase
      .from("members")
      .select("created_at, updated_at, status, last_visit_date")
      .eq("gym_id", userProfile.gym_id)
      .order("created_at", { ascending: true });

    const groupData = (date: Date): string => {
      if (groupBy === "day") {
        return date.toISOString().split("T")[0];
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split("T")[0];
      } else {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }
    };

    const getChurnMonth = (m: { status: string; last_visit_date: string | null; updated_at: string }): string | null => {
      if (m.status !== "inactive" && m.status !== "cancelled") return null;
      if (m.last_visit_date) return m.last_visit_date.slice(0, 7);
      if (m.updated_at) return groupData(new Date(m.updated_at));
      return null;
    };

    const churnedByMonth: Record<string, number> = {};
    allMembers?.forEach((member: any) => {
      const month = getChurnMonth(member);
      if (month) {
        churnedByMonth[month] = (churnedByMonth[month] || 0) + 1;
      }
    });

    const allMonths = new Set<string>();
    allMembers?.forEach((member: any) => {
      const createdDate = new Date(member.created_at);
      allMonths.add(groupData(createdDate));
      const churnMonth = getChurnMonth(member);
      if (churnMonth) allMonths.add(churnMonth);
    });

    const monthlyChurnData: Array<{
      date: string;
      cancelled: number;
      totalAtStart: number;
      churnRate: number;
    }> = [];

    const sortedMonths = Array.from(allMonths).sort();

    sortedMonths.forEach((month) => {
      const monthDate = groupBy === "month" ? new Date(month + "-01") : new Date(month);
      if (dateFilter && monthDate < dateFilter) return;

      const createdBeforeM = allMembers?.filter((m: any) => new Date(m.created_at) < monthDate).length || 0;
      const churnedBeforeM = Object.entries(churnedByMonth).filter(([k]) => k < month).reduce((sum, [, n]) => sum + n, 0);
      const totalAtStart = Math.max(0, createdBeforeM - churnedBeforeM);
      const churnedInM = churnedByMonth[month] || 0;
      const churnRate = totalAtStart > 0 ? Math.round((churnedInM / totalAtStart) * 100 * 10) / 10 : 0;
      const displayDate = groupBy === "month"
        ? new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
        : new Date(month).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

      if (totalAtStart > 0 || churnedInM > 0) {
        monthlyChurnData.push({
          date: displayDate,
          cancelled: churnedInM,
          totalAtStart,
          churnRate,
        });
      } else if (allMembers && allMembers.length > 0) {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        if (monthDate >= twelveMonthsAgo) {
          monthlyChurnData.push({
            date: displayDate,
            cancelled: 0,
            totalAtStart: allMembers.length,
            churnRate: 0,
          });
        }
      }
    });

    const monthlyChurnRate = monthlyChurnData;

    // Ensure monthlyChurnRate is always an array
    const finalMonthlyChurnRate = monthlyChurnRate || [];

    if (campaignIds.length === 0) {
      return NextResponse.json({
        success: true,
        campaignsOverTime: [],
        successRateOverTime: [],
        reengagementOverTime: [],
        monthlyChurnRate: finalMonthlyChurnRate,
        groupBy,
      });
    }

    // Fetch campaign sends with date grouping
    const { data: sends, error } = await supabase
      .from("campaign_sends")
      .select("sent_at, outcome, channel, member_re_engaged")
      .in("campaign_id", campaignIds)
      .gte("sent_at", dateFilter.toISOString())
      .order("sent_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch time-series data: ${error.message}` },
        { status: 500 }
      );
    }


    // Aggregate data by time period
    const timeSeriesData: Record<
      string,
      {
        date: string;
        campaigns_sent: number;
        re_engaged: number;
        total_sent: number;
        email_sent: number;
        sms_sent: number;
        email_re_engaged: number;
        sms_re_engaged: number;
      }
    > = {};

    sends?.forEach((send: any) => {
      const sendDate = new Date(send.sent_at);
      const period = groupData(sendDate);
      const displayDate = groupBy === "month" 
        ? new Date(sendDate.getFullYear(), sendDate.getMonth(), 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
        : groupBy === "week"
        ? new Date(period).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : new Date(period).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      if (!timeSeriesData[period]) {
        timeSeriesData[period] = {
          date: displayDate,
          campaigns_sent: 0,
          re_engaged: 0,
          total_sent: 0,
          email_sent: 0,
          sms_sent: 0,
          email_re_engaged: 0,
          sms_re_engaged: 0,
        };
      }

      timeSeriesData[period].total_sent++;
      timeSeriesData[period].campaigns_sent++;

      if (send.channel === "email") {
        timeSeriesData[period].email_sent++;
        if (send.member_re_engaged || send.outcome === "re_engaged") {
          timeSeriesData[period].email_re_engaged++;
        }
      } else if (send.channel === "sms") {
        timeSeriesData[period].sms_sent++;
        if (send.member_re_engaged || send.outcome === "re_engaged") {
          timeSeriesData[period].sms_re_engaged++;
        }
      }

      if (send.member_re_engaged || send.outcome === "re_engaged") {
        timeSeriesData[period].re_engaged++;
      }
    });

    // Convert to arrays and calculate success rates
    const campaignsOverTime = Object.values(timeSeriesData).map((d) => ({
      date: d.date,
      sent: d.campaigns_sent,
    }));

    const successRateOverTime = Object.values(timeSeriesData)
      .filter((d) => d.total_sent > 0)
      .map((d) => ({
        date: d.date,
        successRate: Math.round((d.re_engaged / d.total_sent) * 100),
        sent: d.total_sent,
        reEngaged: d.re_engaged,
      }));

    const reengagementOverTime = Object.values(timeSeriesData).map((d) => ({
      date: d.date,
      reEngaged: d.re_engaged,
      sent: d.total_sent,
    }));

    return NextResponse.json({
      success: true,
      campaignsOverTime,
      successRateOverTime,
      reengagementOverTime,
      monthlyChurnRate,
      groupBy,
    });
  } catch (error) {
    console.error("Get time-series error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
