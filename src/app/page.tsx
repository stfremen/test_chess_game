import ChessGame from "@/components/ChessGame";
import { getLeaderboard, getRecentMatches } from "@/lib/db";

// This page's data changes on every finished game (via revalidatePath) and
// depends on Supabase being reachable — render it fresh per request rather
// than having Next.js try to prerender it at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [initialMatches, initialLeaderboard] = await Promise.all([
    getRecentMatches(),
    getLeaderboard(),
  ]);
  return <ChessGame initialMatches={initialMatches} initialLeaderboard={initialLeaderboard} />;
}
