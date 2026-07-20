"use client";

import { useEffect, useRef, useState } from "react";
import { Chess, type Color, type Square } from "chess.js";
import Board, { type BoardSquare } from "./Board";
import PlayerClock from "./PlayerClock";
import SetupScreen, { type SetupResult } from "./SetupScreen";
import GameMenu from "./GameMenu";
import { useChessClock, type Side } from "@/hooks/useChessClock";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { saveMatchResult } from "@/app/actions";
import { elapsedMs, nowId, nowIso } from "@/lib/time";
import { DEFAULT_BOARD_THEME_ID, getBoardTheme } from "@/lib/themes";
import { DEFAULT_PIECE_STYLE_ID, getPieceStyle } from "@/lib/pieceStyles";
import type {
  EndReason,
  GameResult,
  LeaderboardEntry,
  MatchRecord,
  NewMatchRecord,
} from "@/lib/db";

type Phase = "setup" | "playing" | "gameover";

interface GameOverInfo {
  result: GameResult;
  endReason: EndReason;
}

interface UndoSnapshot {
  fen: string;
  remainingMs: Record<Side, number>;
  lastMove: { from: Square; to: Square } | null;
  mover: Color;
}

const PROMOTION_PIECES = [
  { piece: "q", glyph: "♕" },
  { piece: "r", glyph: "♖" },
  { piece: "b", glyph: "♗" },
  { piece: "n", glyph: "♘" },
] as const;

const END_REASON_TEXT: Record<EndReason, string> = {
  checkmate: "checkmate",
  stalemate: "stalemate",
  timeout: "running out of time",
  "insufficient-material": "insufficient material",
  "threefold-repetition": "threefold repetition",
  "fifty-move-rule": "the 50-move rule",
};

function snapshotOf(chess: Chess): { board: BoardSquare[][]; checkSquare: Square | null } {
  const board = chess.board() as BoardSquare[][];
  if (!chess.isCheck()) return { board, checkSquare: null };
  const kingSquares = chess.findPiece({ type: "k", color: chess.turn() });
  return { board, checkSquare: kingSquares[0] ?? null };
}

function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.wins - a.wins || a.bestMoveCount - b.bestMoveCount);
}

export default function ChessGame({
  initialMatches,
  initialLeaderboard,
}: {
  initialMatches: MatchRecord[];
  initialLeaderboard: LeaderboardEntry[];
}) {
  const chessRef = useRef(new Chess());
  const moveHistoryRef = useRef<UndoSnapshot[]>([]);

  const [phase, setPhase] = useState<Phase>("setup");
  const [names, setNames] = useState({ white: "Player 1", black: "Player 2" });
  const [timeControlLabel, setTimeControlLabel] = useState("5|3");
  const [baseMs, setBaseMs] = useState(5 * 60_000);
  const [incrementMs, setIncrementMs] = useState(3000);

  const [boardState, setBoardState] = useState<BoardSquare[][]>(() => snapshotOf(new Chess()).board);
  const [checkSquare, setCheckSquare] = useState<Square | null>(null);
  const [selectedSquare, setSelectedSquareState] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [captureTargets, setCaptureTargets] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<GameOverInfo | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>(initialMatches);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);

  const [undosRemaining, setUndosRemaining] = useState<Record<Color, number>>({ w: 0, b: 0 });
  const [undoTopMover, setUndoTopMover] = useState<Color | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [maxUndosPerPlayer, setMaxUndosPerPlayer] = useLocalStorageState("chess:maxUndosPerPlayer", 3);
  const [themeId, setThemeId] = useLocalStorageState("chess:boardTheme", DEFAULT_BOARD_THEME_ID);
  const [pieceStyleId, setPieceStyleId] = useLocalStorageState("chess:pieceStyle", DEFAULT_PIECE_STYLE_ID);
  const theme = getBoardTheme(themeId);
  const pieceStyle = getPieceStyle(pieceStyleId);

  const startTimeRef = useRef<number | null>(null);

  const handleFlagRef = useRef<(side: Side) => void>(() => {});
  const clock = useChessClock({
    initialBaseMs: 5 * 60_000,
    onFlag: (side) => handleFlagRef.current(side),
  });

  // Reads/writes chessRef only from event handlers, never during render,
  // and mirrors what the UI needs into plain React state.
  function refreshBoardSnapshot() {
    const { board, checkSquare: nextCheckSquare } = snapshotOf(chessRef.current);
    setBoardState(board);
    setCheckSquare(nextCheckSquare);
  }

  function refreshUndoInfo() {
    const stack = moveHistoryRef.current;
    setUndoTopMover(stack.length > 0 ? stack[stack.length - 1].mover : null);
  }

  function selectSquare(square: Square | null) {
    setSelectedSquareState(square);
    if (!square) {
      setLegalTargets([]);
      setCaptureTargets([]);
      return;
    }
    const verbose = chessRef.current.moves({ square, verbose: true });
    setLegalTargets(verbose.map((m) => m.to));
    setCaptureTargets(verbose.filter((m) => m.isCapture()).map((m) => m.to));
  }

  function finishGame(result: GameResult, endReason: EndReason) {
    clock.pause();
    setGameOverInfo({ result, endReason });
    setPhase("gameover");

    const durationSeconds = Math.round(elapsedMs(startTimeRef.current) / 1000);
    const winnerName = result === "white" ? names.white : result === "black" ? names.black : null;
    const moveCount = chessRef.current.history().length;

    const record: NewMatchRecord = {
      whiteName: names.white,
      blackName: names.black,
      winnerName,
      result,
      endReason,
      timeControl: timeControlLabel,
      moveCount,
      durationSeconds,
    };

    setMatches((prev) => [{ ...record, id: nowId(), createdAt: nowIso() }, ...prev]);
    if (winnerName) {
      setLeaderboard((prev) => {
        const existing = prev.find((e) => e.name === winnerName);
        const updated = existing
          ? prev.map((e) =>
              e.name === winnerName
                ? { ...e, wins: e.wins + 1, bestMoveCount: Math.min(e.bestMoveCount, moveCount) }
                : e
            )
          : [...prev, { name: winnerName, wins: 1, bestMoveCount: moveCount }];
        return sortLeaderboard(updated);
      });
    }
    saveMatchResult(record).catch(() => {});
  }

  useEffect(() => {
    handleFlagRef.current = (side: Side) => {
      finishGame(side === "w" ? "black" : "white", "timeout");
    };
  });

  useEffect(() => {
    if (phase === "playing") {
      startTimeRef.current = Date.now();
    }
  }, [phase]);

  function checkGameEnd(moverColor: Color) {
    const chess = chessRef.current;
    if (chess.isCheckmate()) {
      finishGame(moverColor === "w" ? "white" : "black", "checkmate");
    } else if (chess.isStalemate()) {
      finishGame("draw", "stalemate");
    } else if (chess.isThreefoldRepetition()) {
      finishGame("draw", "threefold-repetition");
    } else if (chess.isInsufficientMaterial()) {
      finishGame("draw", "insufficient-material");
    } else if (chess.isDrawByFiftyMoves()) {
      finishGame("draw", "fifty-move-rule");
    }
  }

  function executeMove(from: Square, to: Square, promotion?: string) {
    const moverColor = chessRef.current.turn();
    const preMoveFen = chessRef.current.fen();
    try {
      chessRef.current.move({ from, to, promotion });
    } catch {
      return;
    }
    moveHistoryRef.current.push({
      fen: preMoveFen,
      remainingMs: { ...clock.remainingMs },
      lastMove,
      mover: moverColor,
    });
    refreshUndoInfo();
    setLastMove({ from, to });
    selectSquare(null);
    setPendingPromotion(null);
    refreshBoardSnapshot();
    clock.switchTurn(moverColor, incrementMs);
    checkGameEnd(moverColor);
  }

  function undoMove() {
    if (phase !== "playing") return;
    const stack = moveHistoryRef.current;
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    if (undosRemaining[top.mover] <= 0) return;

    stack.pop();
    chessRef.current.load(top.fen);
    clock.restoreState(top.remainingMs, top.mover);
    setLastMove(top.lastMove);
    selectSquare(null);
    setPendingPromotion(null);
    refreshBoardSnapshot();
    setUndosRemaining((prev) => ({ ...prev, [top.mover]: prev[top.mover] - 1 }));
    refreshUndoInfo();
  }

  function trySelect(square: Square) {
    const piece = chessRef.current.get(square);
    if (piece && piece.color === chessRef.current.turn()) {
      selectSquare(square);
    } else {
      selectSquare(null);
    }
  }

  function attemptMove(from: Square, to: Square) {
    const matching = chessRef.current.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (matching.length === 0) {
      trySelect(to);
      return;
    }
    if (matching.some((m) => m.promotion)) {
      setPendingPromotion({ from, to });
      selectSquare(null);
      return;
    }
    executeMove(from, to);
  }

  function onSquareClick(square: Square) {
    if (phase !== "playing" || pendingPromotion || menuOpen) return;
    if (selectedSquare === square) {
      selectSquare(null);
      return;
    }
    if (selectedSquare) {
      attemptMove(selectedSquare, square);
      return;
    }
    trySelect(square);
  }

  function onDropMove(from: Square, to: Square) {
    if (phase !== "playing" || pendingPromotion || menuOpen || from === to) return;
    attemptMove(from, to);
  }

  function resolvePromotion(piece: string) {
    if (!pendingPromotion) return;
    executeMove(pendingPromotion.from, pendingPromotion.to, piece);
  }

  function resetGameplayState(startingBaseMs: number) {
    chessRef.current = new Chess();
    moveHistoryRef.current = [];
    selectSquare(null);
    setPendingPromotion(null);
    setLastMove(null);
    setGameOverInfo(null);
    setUndosRemaining({ w: maxUndosPerPlayer, b: maxUndosPerPlayer });
    setUndoTopMover(null);
    refreshBoardSnapshot();
    clock.resetClock(startingBaseMs);
    clock.start("w");
  }

  function handleStart(setup: SetupResult) {
    setNames({ white: setup.whiteName, black: setup.blackName });
    const newBaseMs = setup.baseMinutes * 60_000;
    const incMs = setup.incrementSeconds * 1000;
    setBaseMs(newBaseMs);
    setIncrementMs(incMs);
    setTimeControlLabel(`${setup.baseMinutes}|${setup.incrementSeconds}`);
    setMenuOpen(false);
    resetGameplayState(newBaseMs);
    setPhase("playing");
  }

  function restartGame() {
    if (!window.confirm("Restart this game? Current progress will be lost.")) return;
    setMenuOpen(false);
    resetGameplayState(baseMs);
    setPhase("playing");
  }

  function quitToSetup() {
    if (!window.confirm("Go back to the start screen? Current game progress will be lost.")) return;
    clock.pause();
    setMenuOpen(false);
    setPhase("setup");
  }

  if (phase === "setup") {
    return (
      <div className="flex h-dvh items-center justify-center overflow-y-auto bg-neutral-900">
        <SetupScreen
          onStart={handleStart}
          recentMatches={matches}
          leaderboard={leaderboard}
          maxUndosPerPlayer={maxUndosPerPlayer}
          onMaxUndosPerPlayerChange={setMaxUndosPerPlayer}
        />
      </div>
    );
  }

  const disabled = phase !== "playing" || !!pendingPromotion || menuOpen;

  function resultText(): string {
    if (!gameOverInfo) return "";
    if (gameOverInfo.result === "draw") return `Draw by ${END_REASON_TEXT[gameOverInfo.endReason]}`;
    const winner = gameOverInfo.result === "white" ? names.white : names.black;
    return `${winner} wins by ${END_REASON_TEXT[gameOverInfo.endReason]}`;
  }

  const undoMoverName = undoTopMover === "w" ? names.white : undoTopMover === "b" ? names.black : null;
  const canUndo = phase === "playing" && undoTopMover !== null && undosRemaining[undoTopMover] > 0;
  const undoLabel =
    undoTopMover === null
      ? "No moves to undo"
      : undosRemaining[undoTopMover] <= 0
        ? `${undoMoverName} has no undos left`
        : `Undo ${undoMoverName}'s last move`;

  return (
    <div className="relative flex h-dvh w-full items-center justify-center gap-4 overflow-hidden bg-neutral-900 px-2 py-2 sm:gap-8">
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        disabled={!!pendingPromotion || phase !== "playing"}
        className="absolute left-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800/80 text-neutral-100 hover:bg-neutral-700 disabled:opacity-40"
        aria-label="Open menu"
      >
        ☰
      </button>

      <PlayerClock
        name={names.black}
        remainingMs={clock.remainingMs.b}
        isActive={clock.activeSide === "b"}
        isFlagged={clock.remainingMs.b <= 0}
        align="left"
      />

      <div className="relative flex flex-col items-center gap-2">
        <Board
          board={boardState}
          selectedSquare={selectedSquare}
          legalTargets={legalTargets}
          captureTargets={captureTargets}
          lastMove={lastMove}
          checkSquare={checkSquare}
          disabled={disabled}
          theme={theme}
          pieceStyle={pieceStyle}
          onSquareClick={onSquareClick}
          onDropMove={onDropMove}
        />

        {pendingPromotion && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
            <div className="flex gap-2 rounded-xl bg-neutral-800 p-3">
              {PROMOTION_PIECES.map((p) => (
                <button
                  key={p.piece}
                  type="button"
                  onClick={() => resolvePromotion(p.piece)}
                  className="flex h-14 w-14 items-center justify-center rounded-lg bg-neutral-700 text-4xl hover:bg-neutral-600"
                >
                  {p.glyph}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "gameover" && gameOverInfo && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-neutral-800 px-8 py-8 text-center">
              <h2 className="text-2xl font-bold text-neutral-50">{resultText()}</h2>
              <button
                type="button"
                onClick={() => setPhase("setup")}
                className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-500"
              >
                New Game
              </button>
            </div>
          </div>
        )}

        {menuOpen && (
          <GameMenu
            onClose={() => setMenuOpen(false)}
            onUndo={undoMove}
            canUndo={canUndo}
            undoLabel={undoLabel}
            undosRemaining={undosRemaining}
            whiteName={names.white}
            blackName={names.black}
            maxUndosPerPlayer={maxUndosPerPlayer}
            onMaxUndosPerPlayerChange={setMaxUndosPerPlayer}
            theme={theme}
            onThemeChange={setThemeId}
            pieceStyle={pieceStyle}
            onPieceStyleChange={setPieceStyleId}
            onRestart={restartGame}
            onQuitToSetup={quitToSetup}
          />
        )}
      </div>

      <PlayerClock
        name={names.white}
        remainingMs={clock.remainingMs.w}
        isActive={clock.activeSide === "w"}
        isFlagged={clock.remainingMs.w <= 0}
        align="right"
      />
    </div>
  );
}
