"use client";

import { Zap } from "lucide-react";

interface ROISummaryPanelProps {
  totalCoachActions: number;
  membersSaved: number;
  roiMultiple: number;
  revenueRetained: number;
  interventionCost: number;
  softwareCost: number;
  avgMembershipValueUsed: number;
}

/**
 * ROI Summary Panel — financial proof-of-value.
 * Total coach actions, members saved, ROI multiple.
 * Formula: (revenue retained − intervention cost) / software cost.
 * Assumptions clearly labeled (avg membership value, intervention cost, software cost).
 */
export default function ROISummaryPanel({
  totalCoachActions,
  membersSaved,
  roiMultiple,
  revenueRetained,
  interventionCost,
  softwareCost,
  avgMembershipValueUsed,
}: ROISummaryPanelProps) {
  return (
    <div className="rounded-xl border-2 border-gray-900 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">ROI summary</h3>
      <p className="mt-1 text-sm text-gray-600">
        What you get for what you pay — explainable, no black-box math.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <p className="text-sm font-medium text-gray-500">
            Total coach actions taken
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {totalCoachActions}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Completed in selected period
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Members saved</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{membersSaved}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Reengaged after intervention
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="rounded-full bg-amber-100 p-2">
            <Zap className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">ROI multiple</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {roiMultiple}x
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              (Revenue − intervention cost) ÷ software cost
            </p>
          </div>
        </div>
      </div>

      {/* Assumptions — clearly labeled */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-700">Assumptions</p>
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          <li>
            <strong>Avg membership value:</strong> £{avgMembershipValueUsed}/mo
            (from your membership types or £30 default)
          </li>
          <li>
            <strong>Intervention cost:</strong> £{interventionCost} total (£5 per
            coach action × {totalCoachActions} actions)
          </li>
          <li>
            <strong>Software cost:</strong> £{softwareCost}/mo (configurable)
          </li>
          <li>
            <strong>ROI formula:</strong> (Revenue retained − Intervention cost) ÷
            Software cost = (£{revenueRetained} − £{interventionCost}) ÷
            £{softwareCost} = {roiMultiple}x
          </li>
        </ul>
      </div>
    </div>
  );
}
