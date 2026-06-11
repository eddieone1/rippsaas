import { NextResponse } from "next/server";

/**
 * POST /api/trial/extend-with-promo
 *
 * @deprecated Free trials are discontinued. Promo codes for trial extension are no longer supported.
 * Subscribe via Settings → Starter (£49/mo) or Growth (£79/mo) per location.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Trial extensions are no longer available. Choose a Starter or Growth plan in Settings, or request a free retention audit at /audit.",
      deprecated: true,
    },
    { status: 410 }
  );
}
