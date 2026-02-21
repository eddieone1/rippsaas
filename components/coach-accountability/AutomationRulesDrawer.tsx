"use client";

import type { AutomationRule } from "./mission-control-types";

interface AutomationRulesDrawerProps {
  rules: AutomationRule[];
  isOpen: boolean;
  onClose: () => void;
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  affectedMemberNote?: string | null;
}

export default function AutomationRulesDrawer({
  rules,
  isOpen,
  onClose,
  onToggleRule,
  affectedMemberNote,
}: AutomationRulesDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="h-full w-full max-w-sm bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Automation rules</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
        <div className="p-4 space-y-4">
          {affectedMemberNote && (
            <div className="rounded-lg border border-lime-200 bg-lime-50 p-3 text-sm text-lime-800">
              {affectedMemberNote}
            </div>
          )}
          <ul className="space-y-3">
            {rules.map((r) => (
              <li key={r.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="mt-0.5 text-xs text-gray-700">{r.description}</p>
                  </div>
                  <label className="shrink-0">
                    <input
                      type="checkbox"
                      checked={r.enabled}
                      onChange={(e) => onToggleRule(r.id, e.target.checked)}
                      className="rounded border-gray-300 text-lime-500"
                    />
                    <span className="ml-1 text-xs text-gray-700">{r.enabled ? "On" : "Off"}</span>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
