"use client";

import type { Coach } from "./types";

interface AssignCoachModalProps {
  memberId: string;
  memberName: string;
  coaches: Coach[];
  currentCoachId: string;
  onAssign: (coachId: string) => void;
  onClose: () => void;
}

export default function AssignCoachModal({
  memberName,
  coaches,
  currentCoachId,
  onAssign,
  onClose,
}: AssignCoachModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">Assign coach</h3>
        <p className="mt-1 text-sm font-medium text-gray-800">{memberName}</p>
        <ul className="mt-4 space-y-2">
          {coaches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  onAssign(c.id);
                  onClose();
                }}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  currentCoachId === c.id
                    ? "border-lime-500 bg-lime-50 text-lime-700"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
