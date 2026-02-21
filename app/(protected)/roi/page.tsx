import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";

/**
 * ROI page redirect — merged into Insights > Retention Impact tab.
 * Keeps /roi URL working for bookmarks and external links.
 */
export default async function ROIPage() {
  await requireAuth();
  redirect("/insights?tab=impact");
}
