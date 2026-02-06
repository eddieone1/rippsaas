import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { MEMBER_STAGES, MEMBER_STAGE_LABELS } from "@/lib/member-intelligence";

/**
 * API endpoint to fetch insights dashboard data
 * Returns engagement rates, churn metrics, campaign performance, and recent activities
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
    const timeRange = searchParams.get("time_range") || "7d";

    // Calculate date filter
    const now = new Date();
    let startDate = new Date();
    if (timeRange === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (timeRange === "90d") {
      startDate.setDate(now.getDate() - 90);
    }

    // Get campaign IDs for this gym
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, channel")
      .eq("gym_id", userProfile.gym_id);

    const campaignIds = campaigns?.map((c) => c.id) || [];

    // Get campaign sends (skip .in() when no campaigns to avoid empty-array issues)
    let campaignSends: any[] = [];
    if (campaignIds.length > 0) {
      const { data: sends } = await supabase
        .from("campaign_sends")
        .select("sent_at, channel, member_re_engaged, campaigns!inner(id, channel)")
        .in("campaign_id", campaignIds)
        .gte("sent_at", startDate.toISOString())
        .order("sent_at", { ascending: false });
      campaignSends = sends ?? [];
    }

    // Calculate engagement rate (re-engagement rate)
    const totalSent = campaignSends?.length || 0;
    const reEngaged = campaignSends?.filter((s) => s.member_re_engaged).length || 0;
    const engagementRate = totalSent > 0 ? Math.round((reEngaged / totalSent) * 100) : 0;

    // Engagement breakdown by channel
    const emailSends = campaignSends?.filter((s) => s.channel === "email") || [];
    const smsSends = campaignSends?.filter((s) => s.channel === "sms") || [];
    const emailReEngaged = emailSends.filter((s) => s.member_re_engaged).length;
    const smsReEngaged = smsSends.filter((s) => s.member_re_engaged).length;

    const engagementBreakdown = {
      emails: emailSends.length > 0 ? Math.round((emailReEngaged / emailSends.length) * 100) : 0,
      sms: smsSends.length > 0 ? Math.round((smsReEngaged / smsSends.length) * 100) : 0,
      automations: 0, // Placeholder - would need to track automation sends separately
    };

    // Monthly churn: recalculated from current member data on every request (no cache).
    // Inactive + cancelled count as churned; churn month = month of last_visit_date (inactive) or last_visit_date else updated_at (cancelled).
    const { data: membersForChurn } = await supabase
      .from("members")
      .select("id, created_at, updated_at, status, last_visit_date")
      .eq("gym_id", userProfile.gym_id);

    type ChurnMonth = string; // YYYY-MM
    const toYYYYMM = (dateStr: string | Date | null | undefined): ChurnMonth | null => {
      if (dateStr == null) return null;
      if (dateStr instanceof Date) {
        const y = dateStr.getFullYear();
        const m = dateStr.getMonth() + 1;
        return `${y}-${String(m).padStart(2, "0")}`;
      }
      const s = String(dateStr).trim();
      if (!s) return null;
      if (s.length >= 7 && s[4] === "-" && s[6] === "-") return s.slice(0, 7);
      const parts = s.split(/[/-]/);
      if (parts.length === 3) {
        const [a, b, c] = parts;
        const y = c.length === 4 ? c : a.length === 4 ? a : null;
        const mo = y === c ? (b.length <= 2 ? b.padStart(2, "0") : b) : y === a ? (b.length <= 2 ? b.padStart(2, "0") : b) : null;
        if (y && mo && Number(mo) >= 1 && Number(mo) <= 12) return `${y}-${mo}`;
      }
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };
    const getChurnMonth = (m: { status: string; last_visit_date?: string | Date | null; updated_at?: string }): ChurnMonth | null => {
      const status = (m.status || "").toString().toLowerCase().trim();
      if (status !== "inactive" && status !== "cancelled") return null;
      const fromVisit = toYYYYMM(m.last_visit_date ?? null);
      if (fromVisit) return fromVisit;
      if (m.updated_at) {
        const d = new Date(m.updated_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }
      return null;
    };

    const churnedByMonth: Record<ChurnMonth, number> = {};
    (membersForChurn || []).forEach((m: any) => {
      const month = getChurnMonth(m);
      if (month) {
        churnedByMonth[month] = (churnedByMonth[month] || 0) + 1;
      }
    });

    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const last12Keys = new Set<ChurnMonth>();
    for (let i = 0; i < 12; i++) {
      let m = thisMonth - i;
      let y = thisYear;
      if (m < 0) {
        m += 12;
        y -= 1;
      }
      last12Keys.add(`${y}-${String(m + 1).padStart(2, "0")}`);
    }
    const allMonthKeys = new Set<ChurnMonth>(Array.from(last12Keys).concat(Object.keys(churnedByMonth) as ChurnMonth[]));
    const sortedKeys = Array.from(allMonthKeys).sort();
    const monthsForSeries: { year: number; month: number; key: ChurnMonth }[] = sortedKeys
      .slice(-24)
      .map((key) => {
        const [y, mo] = key.split("-").map(Number);
        return { year: y, month: mo - 1, key };
      });

    const monthlyChurnRateTimeSeries: Array<{ month: string; churnRate: number; churned: number; totalAtStart: number }> = [];

    monthsForSeries.forEach(({ year, month, key }) => {
      const startOfM = new Date(year, month, 1);
      const startOfNextM = new Date(year, month + 1, 1);
      const churnedBeforeM = Object.entries(churnedByMonth).filter(([k]) => k < key).reduce((sum, [, n]) => sum + n, 0);
      const createdBeforeStartOfM = (membersForChurn || []).filter((m: any) => new Date(m.created_at) < startOfM).length;
      const createdByEndOfM = (membersForChurn || []).filter((m: any) => new Date(m.created_at) < startOfNextM).length;
      const totalAtStartStandard = Math.max(0, createdBeforeStartOfM - churnedBeforeM);
      let totalAtStart = totalAtStartStandard > 0 ? totalAtStartStandard : Math.max(0, createdByEndOfM - churnedBeforeM);
      const churnedInM = churnedByMonth[key] || 0;
      if (churnedInM > 0 && totalAtStart === 0) totalAtStart = churnedInM;
      const churnRate = totalAtStart > 0 ? Math.round((churnedInM / totalAtStart) * 100 * 10) / 10 : 0;
      const displayDate = new Date(year, month, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
      monthlyChurnRateTimeSeries.push({ month: displayDate, churnRate, churned: churnedInM, totalAtStart });
    });

    // Current month = last in series (most recent month)
    const monthlyChurnRate = monthlyChurnRateTimeSeries.length > 0
      ? monthlyChurnRateTimeSeries[monthlyChurnRateTimeSeries.length - 1].churnRate
      : 0;

    // Campaigns sent in last 7 days
    let recentSends: { channel: string }[] = [];
    if (campaignIds.length > 0) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data } = await supabase
        .from("campaign_sends")
        .select("channel")
        .in("campaign_id", campaignIds)
        .gte("sent_at", sevenDaysAgo.toISOString());
      recentSends = data ?? [];
    }

    const campaignsSent7d = recentSends.length;
    const campaignsBreakdown = {
      emails: recentSends.filter((s) => s.channel === "email").length,
      sms: recentSends.filter((s) => s.channel === "sms").length,
      automations: 0, // Placeholder
    };

    // Members at risk
    const { count: membersAtRisk } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("gym_id", userProfile.gym_id)
      .eq("status", "active")
      .in("churn_risk_level", ["high", "medium"]);

    // Member stages breakdown (count per stage)
    const { data: membersByStage } = await supabase
      .from("members")
      .select("member_stage")
      .eq("gym_id", userProfile.gym_id);

    const stageCounts: Record<string, number> = {};
    MEMBER_STAGES.forEach((s) => (stageCounts[s] = 0));
    stageCounts.uncategorized = 0;

    membersByStage?.forEach((m: { member_stage: string | null }) => {
      if (m.member_stage && MEMBER_STAGES.includes(m.member_stage as typeof MEMBER_STAGES[number])) {
        stageCounts[m.member_stage]++;
      } else {
        stageCounts.uncategorized++;
      }
    });

    const memberStagesBreakdown: Array<{ stage: string; label: string; count: number }> = MEMBER_STAGES.map((stage) => ({
      stage,
      label: MEMBER_STAGE_LABELS[stage],
      count: stageCounts[stage] ?? 0,
    }));
    if (stageCounts.uncategorized > 0) {
      memberStagesBreakdown.push({ stage: "uncategorized", label: "Not yet calculated", count: stageCounts.uncategorized });
    }

    // Campaign performance over time (grouped by day)
    const performanceByDay: Record<string, { emails: number; sms: number; automations: number; total: number }> = {};
    
    campaignSends?.forEach((send) => {
      const date = new Date(send.sent_at).toISOString().split("T")[0];
      if (!performanceByDay[date]) {
        performanceByDay[date] = { emails: 0, sms: 0, automations: 0, total: 0 };
      }
      if (send.channel === "email") {
        performanceByDay[date].emails++;
      } else if (send.channel === "sms") {
        performanceByDay[date].sms++;
      }
      performanceByDay[date].total++;
    });

    const campaignPerformance = Object.entries(performanceByDay)
      .map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
        ...counts,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days

    // Recent activities - fetch from campaign_sends and member_activities
    let recentCampaignSends: any[] = [];
    if (campaignIds.length > 0) {
      const { data: campaignSendsData } = await supabase
        .from("campaign_sends")
        .select(`
          id,
          sent_at,
          channel,
          member_re_engaged,
          campaigns!inner(name, channel)
        `)
        .in("campaign_id", campaignIds)
        .gte("sent_at", startDate.toISOString())
        .order("sent_at", { ascending: false })
        .limit(10);
      recentCampaignSends = campaignSendsData ?? [];
    }

    let recentActivitiesData: any[] = [];
    try {
      const { data: memberActivities } = await supabase
        .from("member_activities")
        .select("id, activity_date, activity_type, member_id")
        .gte("activity_date", startDate.toISOString().split("T")[0])
        .order("activity_date", { ascending: false })
        .limit(10);
      const memberIds = Array.from(new Set((memberActivities ?? []).map((a: any) => a.member_id)));
      if (memberIds.length > 0) {
        const { data: membersInGym } = await supabase
          .from("members")
          .select("id, first_name, last_name")
          .eq("gym_id", userProfile.gym_id)
          .in("id", memberIds);
        const memberMap = new Map((membersInGym ?? []).map((m: any) => [m.id, m]));
        recentActivitiesData = (memberActivities ?? [])
          .filter((a: any) => memberMap.has(a.member_id))
          .slice(0, 5)
          .map((a: any) => ({
            ...a,
            members: memberMap.get(a.member_id),
          }));
      }
    } catch {
      recentActivitiesData = [];
    }

    // Format recent activities
    const recentActivities: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: string;
      icon: string;
    }> = [];

    // Add campaign sends
    recentCampaignSends?.slice(0, 5).forEach((send: any) => {
      const sentDate = new Date(send.sent_at);
      const hoursAgo = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60));
      const minutesAgo = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60));
      
      let timestamp = "";
      if (hoursAgo < 1) {
        timestamp = `${minutesAgo} minutes ago`;
      } else if (hoursAgo < 24) {
        timestamp = `${hoursAgo} hours ago`;
      } else {
        timestamp = sentDate.toLocaleDateString('en-GB');
      }

      recentActivities.push({
        id: send.id,
        type: "campaign",
        description: `${send.campaigns?.name || "Campaign"} sent via ${send.channel?.toUpperCase() || "EMAIL"}`,
        timestamp,
        icon: send.member_re_engaged ? "check" : "dot",
      });
    });

    // Add member activities
    recentActivitiesData?.forEach((activity: any) => {
      const activityDate = new Date(activity.activity_date);
      const daysAgo = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let timestamp = "";
      if (daysAgo === 0) {
        timestamp = "Today";
      } else if (daysAgo === 1) {
        timestamp = "Yesterday";
      } else {
        timestamp = `${daysAgo} days ago`;
      }

      const memberName = activity.members ? `${activity.members.first_name} ${activity.members.last_name}` : "Member";
      
      if (activity.activity_type === "visit" || activity.activity_type === "check_in") {
        recentActivities.push({
          id: activity.id,
          type: "visit",
          description: `${memberName} visited the gym`,
          timestamp,
          icon: "check",
        });
      }
    });

    // Sort by timestamp and limit to 5 most recent
    recentActivities.sort((a, b) => {
      // Simple sort - in production would parse timestamps properly
      return 0;
    });

    const finalRecentActivities = recentActivities.slice(0, 5);

    // Always return full shape so the frontend never gets undefined fields
    return NextResponse.json({
      engagementRate: engagementRate ?? 0,
      engagementBreakdown: engagementBreakdown ?? { emails: 0, sms: 0, automations: 0 },
      monthlyChurnRate: monthlyChurnRate ?? 0,
      monthlyChurnRateTimeSeries: monthlyChurnRateTimeSeries ?? [],
      campaignsSent7d: campaignsSent7d ?? 0,
      campaignsBreakdown: campaignsBreakdown ?? { emails: 0, sms: 0, automations: 0 },
      membersAtRisk: membersAtRisk ?? 0,
      memberStagesBreakdown: memberStagesBreakdown ?? [],
      campaignPerformance: campaignPerformance ?? [],
      recentActivities: finalRecentActivities ?? [],
    });
  } catch (error) {
    console.error("Get insights dashboard error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
