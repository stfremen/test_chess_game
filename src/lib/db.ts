import "server-only";
import { createClient } from "@supabase/supabase-js";
import { sortLeaderboard } from "./leaderboard";

// Plain server-side client — no @supabase/ssr needed since this app has no
// Auth/session/cookies at all, every call happens in a Server Component or
// Server Action, and nothing here is ever imported from a Client Component
// (the "server-only" import above turns that mistake into a build error).
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

const RESULTS_TABLE = "results";

export type GameResult = "white" | "black" | "draw";

export type EndReason =
  | "checkmate"
  | "stalemate"
  | "timeout"
  | "insufficient-material"
  | "threefold-repetition"
  | "fifty-move-rule";

export interface MatchRecord {
  id: number;
  whiteName: string;
  blackName: string;
  winnerName: string | null;
  result: GameResult;
  endReason: EndReason;
  timeControl: string;
  moveCount: number;
  durationSeconds: number;
  createdAt: string;
}

export interface NewMatchRecord {
  whiteName: string;
  blackName: string;
  winnerName: string | null;
  result: GameResult;
  endReason: EndReason;
  timeControl: string;
  moveCount: number;
  durationSeconds: number;
}

interface ResultsRow {
  id: number;
  white_name: string;
  black_name: string;
  winner_name: string | null;
  result: GameResult;
  end_reason: EndReason;
  time_control: string;
  move_count: number;
  duration_seconds: number;
  created_at: string;
}

function toMatchRecord(row: ResultsRow): MatchRecord {
  return {
    id: row.id,
    whiteName: row.white_name,
    blackName: row.black_name,
    winnerName: row.winner_name,
    result: row.result,
    endReason: row.end_reason,
    timeControl: row.time_control,
    moveCount: row.move_count,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  };
}

export async function insertMatchResult(record: NewMatchRecord): Promise<void> {
  const { error } = await supabase.from(RESULTS_TABLE).insert({
    white_name: record.whiteName,
    black_name: record.blackName,
    winner_name: record.winnerName,
    result: record.result,
    end_reason: record.endReason,
    time_control: record.timeControl,
    move_count: record.moveCount,
    duration_seconds: record.durationSeconds,
  });
  if (error) throw new Error(`insertMatchResult failed: ${error.message}`);
}

export async function getRecentMatches(limit = 20): Promise<MatchRecord[]> {
  const { data, error } = await supabase
    .from(RESULTS_TABLE)
    .select(
      "id, white_name, black_name, winner_name, result, end_reason, time_control, move_count, duration_seconds, created_at"
    )
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRecentMatches failed: ${error.message}`);
  return (data as ResultsRow[]).map(toMatchRecord);
}

export interface LeaderboardEntry {
  name: string;
  wins: number;
  bestMoveCount: number;
}

// PostgREST has no arbitrary GROUP BY, so wins/best-move-count are aggregated
// here in JS rather than in a Postgres view — fine at hackathon scale. The
// explicit limit guards against Supabase's default 1000-row Data API cap,
// which would otherwise silently truncate this aggregation with no error
// once total decisive games passed that count.
const LEADERBOARD_SOURCE_ROW_LIMIT = 5000;

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from(RESULTS_TABLE)
    .select("winner_name, move_count")
    .not("winner_name", "is", null)
    .limit(LEADERBOARD_SOURCE_ROW_LIMIT);
  if (error) throw new Error(`getLeaderboard failed: ${error.message}`);

  const byName = new Map<string, LeaderboardEntry>();
  for (const row of data as Pick<ResultsRow, "winner_name" | "move_count">[]) {
    const name = row.winner_name as string;
    const existing = byName.get(name);
    if (existing) {
      existing.wins += 1;
      existing.bestMoveCount = Math.min(existing.bestMoveCount, row.move_count);
    } else {
      byName.set(name, { name, wins: 1, bestMoveCount: row.move_count });
    }
  }
  return sortLeaderboard([...byName.values()]).slice(0, limit);
}
