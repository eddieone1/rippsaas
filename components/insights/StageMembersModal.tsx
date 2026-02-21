"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StageMember {
  id: string;
  name: string;
  email: string | null;
  commitmentScore: number;
  churnRiskLevel: string;
  daysSinceLastVisit: number | null;
}

interface StageMembersModalProps {
  stage: string;
  label: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StageMembersModal({
  stage,
  label,
  isOpen,
  onClose,
}: StageMembersModalProps) {
  const [members, setMembers] = useState<StageMember[]>([]);
  const [behaviourInterpretation, setBehaviourInterpretation] = useState("");
  const [play, setPlay] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !stage) return;
    setLoading(true);
    fetch(`/api/insights/members-by-stage?stage=${encodeURIComponent(stage)}`)
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members ?? []);
        setBehaviourInterpretation(data.behaviourInterpretation ?? "");
        setPlay(data.play ?? "");
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [isOpen, stage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-lg bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
          <p className="mt-1 text-sm text-gray-600">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-lime-200 bg-lime-50/50 p-3 text-sm">
                <p className="font-medium text-gray-900 mb-1">Behaviour interpretation</p>
                <p className="text-gray-700">{behaviourInterpretation}</p>
              </div>
              {play && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-gray-900 mb-1">Recommended play</p>
                  <p className="text-gray-700">{play}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 mb-2">Members</p>
                <ul className="space-y-2">
                  {members.length === 0 ? (
                    <li className="text-sm text-gray-500">No members in this stage</li>
                  ) : (
                    members.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
                      >
                        <div>
                          <Link
                            href={`/members/${m.id}`}
                            className="text-sm font-medium text-lime-600 hover:text-lime-800"
                          >
                            {m.name}
                          </Link>
                          {m.email && (
                            <p className="text-xs text-gray-500">{m.email}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {m.commitmentScore} score
                          </span>
                          {m.daysSinceLastVisit !== null && (
                            <span className="text-xs text-gray-500">
                              {m.daysSinceLastVisit}d since visit
                            </span>
                          )}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <Link
            href={stage === "at_risk_silent_quit" || stage === "emotional_disengagement" ? "/members/at-risk" : "/members"}
            className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400"
          >
            View in members
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
