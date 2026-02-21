"use client";

import { Info } from "lucide-react";

/**
 * Metrics Explanation — how we calculate retention impact.
 * Calculations are explainable; no black box math. Data from coach_actions,
 * campaign_sends, and member status.
 */
export default function MetricsExplanation() {
  return (
    <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-gray-200 p-2">
          <Info className="h-5 w-5 text-gray-700" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            How we calculate retention impact
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900">Revenue saved</p>
              <p>
                Estimated revenue from members who made another visit after an
                intervention (re-engagement = physical return to the gym). Uses each member’s membership type and billing
                frequency; assumes saved members stay active for 3 months. No
                fabricated data.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Members retained</p>
              <p>
                Count of members who made another visit after a campaign send or coach
                action. Re-engagement = member visited the gym. Source: campaign_sends with outcome = re_engaged.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Churn rate reduction</p>
              <p>
                (Members reengaged ÷ (Members churned + Members reengaged)) ×
                100. Baseline churn comes from member status (cancelled);
                current churn is adjusted by reengagements.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">ROI multiple</p>
              <p>
                (Revenue retained − Estimated intervention cost) ÷ Software
                cost. Intervention cost = £5 per coach action (conservative
                default). Clearly labeled assumptions appear in the ROI summary
                panel above.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="font-semibold text-gray-900">Data sources</p>
              <p className="mt-1">
                Metrics derive from: campaign_sends outcomes (re_engaged, no_response, cancelled),
                coach_actions completions, and member churn status. We do not fabricate data; if insufficient data exists,
                we show “Not enough data yet” and explain what’s needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
