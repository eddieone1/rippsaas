"use client";

import { useMemo } from "react";

interface DashboardCommentaryProps {
  atRiskCount: number;
  avgCommitmentScore: number;
  revenueAtRisk: number;
  revenueSaved: number;
  lastSnapshot?: {
    atRiskCount: number;
    avgCommitmentScore: number;
    revenueAtRisk: number;
    revenueSaved: number;
    snapshotAt: string;
  } | null;
}

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function buildGoodCommentary(
  atRiskCount: number,
  avgCommitmentScore: number,
  revenueSaved: number,
  lastSnapshot: DashboardCommentaryProps["lastSnapshot"],
  seed: number
): string {
  const openers = [
    "Nice work, your retention efforts are really paying off",
    "Things are looking great right now",
    "Solid progress across the board",
    "Your gym is in a strong spot",
  ];

  let msg = pickRandom(openers, seed);

  const atRiskImproved =
    atRiskCount < (lastSnapshot?.atRiskCount ?? atRiskCount + 1);

  if (atRiskImproved && avgCommitmentScore >= 60) {
    msg += `, with at-risk members dropping to a new low of ${atRiskCount} and your commitment score sitting at a healthy ${avgCommitmentScore}/100.`;
  } else if (atRiskImproved) {
    msg += `, and at-risk members have dropped to just ${atRiskCount}, which is a new low.`;
  } else if (avgCommitmentScore >= 60) {
    msg += `, with your commitment score at a strong ${avgCommitmentScore}/100.`;
  } else {
    msg += ".";
  }

  if (revenueSaved > 0) {
    msg += ` You've also retained £${revenueSaved} in revenue from members who re-engaged, which is a great sign.`;
  }

  const tips = [
    "Keep nurturing your top members and staying consistent because momentum matters.",
    "A good next step would be to keep an eye on anyone trending downward, so you can catch them early.",
    "You might want to celebrate some member milestones this week to reinforce those positive habits.",
  ];

  msg += " " + pickRandom(tips, seed + 1);

  return msg;
}

function buildBadCommentary(
  atRiskCount: number,
  avgCommitmentScore: number,
  revenueAtRisk: number,
  seed: number
): string {
  const details: string[] = [];

  if (atRiskCount > 5) {
    details.push(`${atRiskCount} members are flagged as at-risk`);
  }
  if (avgCommitmentScore < 50) {
    details.push(
      `your overall commitment score has dipped to ${avgCommitmentScore}/100`
    );
  }
  if (revenueAtRisk > 500) {
    details.push(`there's roughly £${revenueAtRisk} in revenue on the line`);
  }

  let msg: string;

  if (details.length === 0) {
    msg =
      "A few of your metrics could use some attention right now, so it's worth taking a closer look.";
  } else if (details.length === 1) {
    msg = `Heads up, ${details[0]}, so this is a good time to step in.`;
  } else {
    const last = details.pop()!;
    msg = `Heads up, ${details.join(", ")} and ${last}, so it's a good time to focus on retention.`;
  }

  const tips = [
    "Try reaching out to your at-risk members with a quick personal check-in before they drift further away.",
    "Consider scheduling some check-ins with members who haven't visited recently because a little outreach goes a long way.",
    "Take a look at what's driving commitment scores down; recency and consistency tend to matter most, so even a simple nudge can help.",
    "A targeted win-back play for lapsed members could make a real difference here.",
  ];

  msg += " " + pickRandom(tips, seed + 2);

  return msg;
}

export default function DashboardCommentary({
  atRiskCount,
  avgCommitmentScore,
  revenueAtRisk,
  revenueSaved,
  lastSnapshot,
}: DashboardCommentaryProps) {
  const commentary = useMemo(() => {
    const seed = Date.now() % 1000;
    const isGood =
      atRiskCount <= 5 &&
      avgCommitmentScore >= 55 &&
      revenueAtRisk < 500 &&
      (revenueSaved > 0 || atRiskCount === 0);

    if (isGood) {
      return buildGoodCommentary(
        atRiskCount,
        avgCommitmentScore,
        revenueSaved,
        lastSnapshot,
        seed
      );
    }
    return buildBadCommentary(
      atRiskCount,
      avgCommitmentScore,
      revenueAtRisk,
      seed
    );
  }, [atRiskCount, avgCommitmentScore, revenueAtRisk, revenueSaved, lastSnapshot]);

  return (
    <div className="rounded-lg border border-lime-200 bg-lime-50/50 p-4">
      <p className="text-sm leading-relaxed text-gray-800">{commentary}</p>
    </div>
  );
}
