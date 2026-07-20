"use client";

import type { MatchRecord } from "@/lib/db";

const END_REASON_LABEL: Record<MatchRecord["endReason"], string> = {
  checkmate: "checkmate",
  stalemate: "stalemate",
  timeout: "on time",
  "insufficient-material": "insufficient material",
  "threefold-repetition": "threefold repetition",
  "fifty-move-rule": "50-move rule",
};

export default function RecentMatches({ matches }: { matches: MatchRecord[] }) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center">No games recorded yet — play one!</p>
    );
  }

  return (
    <div className="w-full flex flex-col gap-1 max-h-20 overflow-y-auto">
      {matches.map((match) => (
        <div
          key={match.id}
          className="flex items-center justify-between rounded-lg bg-neutral-800/50 px-3 py-2 text-sm"
        >
          <div className="flex flex-col">
            <span className="font-medium text-neutral-100">
              {match.winnerName ? `${match.winnerName} won` : "Draw"}
            </span>
            <span className="text-xs text-neutral-400">
              {match.whiteName} vs {match.blackName} · {END_REASON_LABEL[match.endReason]} ·{" "}
              {match.timeControl} · {match.moveCount} moves
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
