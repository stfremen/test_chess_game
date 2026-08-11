import type { LeaderboardEntry } from "./db";

export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.wins - a.wins || a.bestMoveCount - b.bestMoveCount);
}
