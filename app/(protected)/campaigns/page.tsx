import { getGymContext } from "@/lib/supabase/get-gym-context";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CampaignsView from "@/components/campaigns/CampaignsView";

export default async function CampaignsPage() {
  const { gymId } = await getGymContext();

  if (!gymId) {
    redirect("/onboarding/gym-info");
  }

  const supabase = await createClient();

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
          .select("campaign_id, sent_at")
          .in("campaign_id", campaignIds)
      : { data: [] };

  const sendsByCampaign: Record<string, { sent_at: string }[]> = {};
  campaignSends?.forEach((send) => {
    if (!sendsByCampaign[send.campaign_id]) {
      sendsByCampaign[send.campaign_id] = [];
    }
    sendsByCampaign[send.campaign_id].push(send);
  });

  const campaignStats = campaigns?.map((c) => {
    const sends = sendsByCampaign[c.id] ?? [];
    const lastSent =
      sends.length > 0
        ? new Date(Math.max(...sends.map((s) => new Date(s.sent_at).getTime())))
        : null;
    return {
      id: c.id,
      name: c.name,
      trigger_days: c.trigger_days,
      status: c.status,
      channel: c.channel,
      target_segment: (c as { target_segment?: string }).target_segment ?? "all",
      include_cancelled: (c as { include_cancelled?: boolean }).include_cancelled ?? false,
      sentCount: sends.length,
      lastSent,
    };
  }) ?? [];

  const { data: templates } = await supabase
    .from("campaign_templates")
    .select("id, name, subject, body, channel")
    .or(`gym_id.eq.${gymId},gym_id.is.null`)
    .order("channel")
    .order("name");

  return (
    <CampaignsView
      campaigns={campaignStats}
      templates={templates ?? []}
      gymId={gymId}
    />
  );
}
