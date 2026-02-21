import { getGymContext } from "@/lib/supabase/get-gym-context";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlaysPageView from "@/components/campaigns/PlaysPageView";

export default async function PlaysPage() {
  const { gymId } = await getGymContext();

  if (!gymId) {
    redirect("/onboarding/gym-info");
  }

  const supabase = await createClient();

  // Fetch campaigns (manual sends history)
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("gym_id", gymId)
    .order("created_at", { ascending: false });

  const campaignIds = campaigns?.map((c) => c.id) ?? [];
  const { data: campaignSends } =
    campaignIds.length > 0
      ? await supabase
          .from("campaign_sends")
          .select("campaign_id, sent_at, outcome, member_re_engaged")
          .in("campaign_id", campaignIds)
      : { data: [] };

  const sendsByCampaign: Record<string, { sent_at: string; outcome?: string | null; member_re_engaged?: boolean }[]> = {};
  campaignSends?.forEach((send) => {
    if (!sendsByCampaign[send.campaign_id]) {
      sendsByCampaign[send.campaign_id] = [];
    }
    sendsByCampaign[send.campaign_id].push(send);
  });

  const campaignStats =
    campaigns?.map((c) => {
      const sends = sendsByCampaign[c.id] ?? [];
      const lastSent =
        sends.length > 0
          ? new Date(
              Math.max(...sends.map((s) => new Date(s.sent_at).getTime()))
            )
          : null;
      const reEngaged = sends.filter((s) => s.outcome === "re_engaged" || s.member_re_engaged).length;
      const successRate = sends.length > 0 ? Math.round((reEngaged / sends.length) * 100) : 0;
      return {
        id: c.id,
        name: c.name,
        trigger_days: c.trigger_days,
        status: c.status,
        channel: c.channel,
        template_id: (c as { template_id?: string }).template_id,
        target_segment:
          (c as { target_segment?: string }).target_segment ?? "all",
        include_cancelled:
          (c as { include_cancelled?: boolean }).include_cancelled ?? false,
        sentCount: sends.length,
        lastSent,
        reEngaged,
        successRate,
      };
    }) ?? [];

  // Fetch campaign templates
  const { data: templates } = await supabase
    .from("campaign_templates")
    .select("id, name, subject, body, channel")
    .or(`gym_id.eq.${gymId},gym_id.is.null`)
    .order("channel")
    .order("name");

  return (
    <PlaysPageView
      campaigns={campaignStats}
      templates={templates ?? []}
      gymId={gymId}
    />
  );
}
