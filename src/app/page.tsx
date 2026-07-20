import ChessGame from "@/components/ChessGame";
import { getLeaderboard, getRecentMatches } from "@/lib/db";

export default async function Home() {
  const initialMatches = getRecentMatches();
  const initialLeaderboard = getLeaderboard();
  return <ChessGame initialMatches={initialMatches} initialLeaderboard={initialLeaderboard} />;
}
