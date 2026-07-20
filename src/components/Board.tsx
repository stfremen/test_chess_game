"use client";

import type { Color, PieceSymbol, Square } from "chess.js";
import type { BoardTheme } from "@/lib/themes";
import type { PieceStyle } from "@/lib/pieceStyles";

export type BoardSquare = { square: Square; type: PieceSymbol; color: Color } | null;

interface BoardProps {
  board: BoardSquare[][];
  selectedSquare: Square | null;
  legalTargets: Square[];
  captureTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  checkSquare: Square | null;
  disabled: boolean;
  theme: BoardTheme;
  pieceStyle: PieceStyle;
  onSquareClick: (square: Square) => void;
  onDropMove: (from: Square, to: Square) => void;
}

const PIECE_GLYPHS: Record<Color, Record<PieceSymbol, string>> = {
  w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
  b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
};

export default function Board({
  board,
  selectedSquare,
  legalTargets,
  captureTargets,
  lastMove,
  checkSquare,
  disabled,
  theme,
  pieceStyle,
  onSquareClick,
  onDropMove,
}: BoardProps) {
  const legalSet = new Set(legalTargets);
  const captureSet = new Set(captureTargets);

  return (
    <div
      className="grid grid-cols-8 grid-rows-8 border-2 border-neutral-800 shadow-xl select-none"
      style={{ width: "min(88vh, 88vw, 640px)", height: "min(88vh, 88vw, 640px)" }}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isLight = (rowIndex + colIndex) % 2 === 0;
          const square = cell?.square ?? indexToSquare(rowIndex, colIndex);
          const isSelected = selectedSquare === square;
          const isLegalTarget = legalSet.has(square);
          const isCaptureTarget = captureSet.has(square);
          const isLastMove = lastMove?.from === square || lastMove?.to === square;
          const isCheck = checkSquare === square;
          const fill = cell?.color === "w" ? pieceStyle.whiteFill : pieceStyle.blackFill;
          const stroke = cell?.color === "w" ? pieceStyle.whiteStroke : pieceStyle.blackStroke;

          return (
            <div
              key={square}
              data-square={square}
              onClick={() => !disabled && onSquareClick(square)}
              onDragOver={(e) => !disabled && e.preventDefault()}
              onDrop={(e) => {
                if (disabled) return;
                e.preventDefault();
                const from = e.dataTransfer.getData("text/plain") as Square;
                if (from) onDropMove(from, square);
              }}
              className={[
                "relative flex items-center justify-center",
                isLight ? theme.light : theme.dark,
                isLastMove ? "after:absolute after:inset-0 after:bg-yellow-400/40" : "",
                isCheck ? "after:absolute after:inset-0 after:bg-red-500/50" : "",
                disabled ? "cursor-default" : "cursor-pointer",
              ].join(" ")}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-sky-400/40 ring-2 ring-inset ring-sky-500" />
              )}
              {cell && (
                <span
                  draggable={!disabled}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", square);
                    onSquareClick(square);
                  }}
                  className="relative z-10 text-[7vmin] leading-none"
                  style={{
                    color: fill,
                    WebkitTextStroke: cell.color === "w" ? `2px ${stroke}` : `1.5px ${stroke}`,
                    fontVariantEmoji: "text",
                    filter:
                      cell.color === "w"
                        ? "drop-shadow(0 1px 2px rgba(0,0,0,0.55))"
                        : "drop-shadow(0 1px 1px rgba(0,0,0,0.25))",
                  }}
                >
                  {PIECE_GLYPHS[cell.color][cell.type]}
                </span>
              )}
              {!cell && isLegalTarget && (
                <div className="absolute h-[28%] w-[28%] rounded-full bg-black/20" />
              )}
              {isCaptureTarget && (
                <div className="absolute inset-0 ring-[6px] ring-inset ring-black/25 rounded-sm" />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function indexToSquare(rowIndex: number, colIndex: number): Square {
  const rank = 8 - rowIndex;
  const file = FILES[colIndex];
  return `${file}${rank}` as Square;
}
