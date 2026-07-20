"use client";

import type { LeaderboardEntry } from "@/lib/db";

export default function HighScoreBoard({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-neutral-500 text-center">No wins recorded yet.</p>;
  }

  return (
    <div className="w-full flex flex-col gap-1 max-h-32 overflow-y-auto">
      {entries.map((entry, index) => (
        <div
          key={entry.name}
          className="flex items-center justify-between rounded-lg bg-neutral-800/50 px-3 py-1.5 text-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono text-neutral-500 w-4 shrink-0">{index + 1}</span>
            <span className="font-medium text-neutral-100 truncate">{entry.name}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs text-neutral-400">
            <span>
              <span className="text-neutral-100 font-semibold">{entry.wins}</span> win
              {entry.wins === 1 ? "" : "s"}
            </span>
            <span>
              best <span className="text-neutral-100 font-semibold">{entry.bestMoveCount}</span> mv
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
