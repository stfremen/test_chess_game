import Database from "better-sqlite3";
import path from "path";

// Deliberately kept outside the project root: Next's dev-mode file watcher
// treats any write inside the project tree as a source change and triggers
// a full reload, which would fire on every single insert into this file.
const db = new Database(path.join(process.cwd(), "..", "game.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    white_name TEXT NOT NULL,
    black_name TEXT NOT NULL,
    winner_name TEXT,
    result TEXT NOT NULL,
    end_reason TEXT NOT NULL,
    time_control TEXT NOT NULL,
    move_count INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

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

const insertStmt = db.prepare(`
  INSERT INTO results
    (white_name, black_name, winner_name, result, end_reason, time_control, move_count, duration_seconds)
  VALUES
    (@whiteName, @blackName, @winnerName, @result, @endReason, @timeControl, @moveCount, @durationSeconds)
`);

export function insertMatchResult(record: NewMatchRecord): void {
  insertStmt.run(record);
}

const recentStmt = db.prepare(`
  SELECT
    id,
    white_name AS whiteName,
    black_name AS blackName,
    winner_name AS winnerName,
    result,
    end_reason AS endReason,
    time_control AS timeControl,
    move_count AS moveCount,
    duration_seconds AS durationSeconds,
    created_at AS createdAt
  FROM results
  ORDER BY id DESC
  LIMIT @limit
`);

export function getRecentMatches(limit = 20): MatchRecord[] {
  return recentStmt.all({ limit }) as MatchRecord[];
}

export interface LeaderboardEntry {
  name: string;
  wins: number;
  bestMoveCount: number;
}

const leaderboardStmt = db.prepare(`
  SELECT
    winner_name AS name,
    COUNT(*) AS wins,
    MIN(move_count) AS bestMoveCount
  FROM results
  WHERE winner_name IS NOT NULL
  GROUP BY winner_name
  ORDER BY wins DESC, bestMoveCount ASC
  LIMIT @limit
`);

export function getLeaderboard(limit = 10): LeaderboardEntry[] {
  return leaderboardStmt.all({ limit }) as LeaderboardEntry[];
}
