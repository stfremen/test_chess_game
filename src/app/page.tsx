import { connection } from "next/server";
import ChessGame from "@/components/ChessGame";
import { getLeaderboard, getRecentMatches, type LeaderboardEntry, type MatchRecord } from "@/lib/db";

export default async function Home() {
  // connection() is the Next.js 16 way to ensure this page is always
  // rendered on a live request, never prerendered at build time.
  await connection();

  let initialMatches: MatchRecord[] = [];
  let initialLeaderboard: LeaderboardEntry[] = [];
  try {
    [initialMatches, initialLeaderboard] = await Promise.all([
      getRecentMatches(),
      getLeaderboard(),
    ]);
  } catch {
    // DB unavailable (missing env vars, network, etc.) — render the game without history
  }
  return <ChessGame initialMatches={initialMatches} initialLeaderboard={initialLeaderboard} />;
}
