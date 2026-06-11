import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/jobs/safety";

/**
 * POST /api/cron/trial-reminders
 *
 * @deprecated Trial reminders discontinued — Free Retention Audit replaced the free trial.
 * Use POST /api/cron/subscription-nudges instead (scheduled in vercel.json).
 * This route remains as a no-op so old cron URLs do not error during deploy cutover.
 */
export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    deprecated: true,
    message:
      "Trial reminders are disabled. Nurture emails run via /api/cron/subscription-nudges.",
    sent7d: 0,
    sent3d: 0,
    sent1d: 0,
  });
}
