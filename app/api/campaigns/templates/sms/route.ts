import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * API endpoint to seed default SMS templates
 * These are system-wide templates available to all gyms
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Default SMS templates
    const defaultSmsTemplates = [
      {
        name: "We Haven't Seen You in a While",
        subject: "", // SMS doesn't have subject
        body: "Hi {{first_name}}, we haven't seen you at {{gym_name}} in a while. We'd love to have you back! Reply STOP to unsubscribe.",
        channel: "sms",
        gym_id: null, // System-wide template
      },
      {
        name: "Bring a Friend on Us",
        subject: "",
        body: "Hi {{first_name}}, bring a friend to {{gym_name}} and your next session is on us! Valid until next week. Reply STOP to unsubscribe.",
        channel: "sms",
        gym_id: null,
      },
      {
        name: "21+ Days Inactive",
        subject: "",
        body: "Hi {{first_name}}, it's been 21+ days since your last visit to {{gym_name}}. We miss you! Come back and get back on track. Reply STOP to unsubscribe.",
        channel: "sms",
        gym_id: null,
      },
      {
        name: "30+ Days Inactive",
        subject: "",
        body: "Hi {{first_name}}, we noticed you haven't been to {{gym_name}} in over 30 days. Your membership is still active - come back anytime! Reply STOP to unsubscribe.",
        channel: "sms",
        gym_id: null,
      },
      {
        name: "60+ Days Inactive",
        subject: "",
        body: "Hi {{first_name}}, it's been 60+ days since your last visit to {{gym_name}}. We'd love to help you get back into your fitness routine. Reply STOP to unsubscribe.",
        channel: "sms",
        gym_id: null,
      },
    ];

    // Check if templates already exist
    const { data: existingTemplates } = await adminClient
      .from("campaign_templates")
      .select("name, channel")
      .eq("channel", "sms")
      .is("gym_id", null);

    const existingNames = new Set(existingTemplates?.map((t) => t.name) || []);

    // Only insert templates that don't exist
    const templatesToInsert = defaultSmsTemplates.filter(
      (t) => !existingNames.has(t.name)
    );

    if (templatesToInsert.length === 0) {
      return NextResponse.json({
        success: true,
        message: "SMS templates already exist",
        created: 0,
      });
    }

    // Insert new templates
    const { data: insertedTemplates, error } = await adminClient
      .from("campaign_templates")
      .insert(templatesToInsert)
      .select();

    if (error) {
      return NextResponse.json(
        { error: `Failed to create SMS templates: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Created ${insertedTemplates?.length || 0} SMS templates`,
      created: insertedTemplates?.length || 0,
      templates: insertedTemplates,
    });
  } catch (error) {
    console.error("Create SMS templates error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
