"use client";

import type { Play } from "./types";

interface PlayCardProps {
  play: Play;
  onLaunch: (playId: string) => void;
  disabled?: boolean;
}

export default function PlayCard({ play, onLaunch, disabled }: PlayCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h4 className="font-semibold text-gray-900">{play.name}</h4>
      <p className="mt-1 text-xs text-gray-700">When: {play.whenToUse}</p>
      <p className="mt-0.5 text-xs text-gray-600">Time: {play.timeToRun}</p>
      <ul className="mt-2 space-y-1 text-xs text-gray-700">
        {play.steps.slice(0, 3).map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-medium text-lime-600">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onLaunch(play.id)}
        disabled={disabled}
        className="mt-3 w-full rounded-lg bg-lime-500 py-2 text-sm font-semibold text-white hover:bg-lime-600 disabled:opacity-50"
      >
        Launch for member
      </button>
    </div>
  );
}
