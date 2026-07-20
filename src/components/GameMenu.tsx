"use client";

import { BOARD_THEMES, type BoardTheme } from "@/lib/themes";
import { PIECE_STYLES, type PieceStyle } from "@/lib/pieceStyles";

interface GameMenuProps {
  onClose: () => void;
  onUndo: () => void;
  canUndo: boolean;
  undoLabel: string;
  undosRemaining: { w: number; b: number };
  whiteName: string;
  blackName: string;
  maxUndosPerPlayer: number;
  onMaxUndosPerPlayerChange: (value: number) => void;
  theme: BoardTheme;
  onThemeChange: (id: string) => void;
  pieceStyle: PieceStyle;
  onPieceStyleChange: (id: string) => void;
  onRestart: () => void;
  onQuitToSetup: () => void;
}

export default function GameMenu({
  onClose,
  onUndo,
  canUndo,
  undoLabel,
  undosRemaining,
  whiteName,
  blackName,
  maxUndosPerPlayer,
  onMaxUndosPerPlayerChange,
  theme,
  onThemeChange,
  pieceStyle,
  onPieceStyleChange,
  onRestart,
  onQuitToSetup,
}: GameMenuProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="flex max-h-full w-80 flex-col gap-4 overflow-y-auto rounded-2xl bg-neutral-800 p-5 text-neutral-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Menu</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <section className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-neutral-400">Game</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRestart}
              className="flex-1 rounded-lg bg-neutral-700 py-2 text-sm font-semibold hover:bg-neutral-600"
            >
              Restart Game
            </button>
            <button
              type="button"
              onClick={onQuitToSetup}
              className="flex-1 rounded-lg bg-neutral-700 py-2 text-sm font-semibold hover:bg-neutral-600"
            >
              Back to Start Screen
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-neutral-400">Undo</span>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500"
          >
            {undoLabel}
          </button>
          <div className="flex justify-between text-xs text-neutral-400">
            <span>
              {whiteName}: {undosRemaining.w} left
            </span>
            <span>
              {blackName}: {undosRemaining.b} left
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-neutral-900/50 px-3 py-2">
            <span className="text-xs text-neutral-400">
              max undos per player
              <br />
              <span className="text-[10px] text-neutral-500">applies to next game</span>
            </span>
            <div className="flex items-center gap-2">
              <StepButton
                onClick={() => onMaxUndosPerPlayerChange(Math.max(0, maxUndosPerPlayer - 1))}
                label="-"
              />
              <span className="w-6 text-center font-mono">{maxUndosPerPlayer}</span>
              <StepButton
                onClick={() => onMaxUndosPerPlayerChange(Math.min(10, maxUndosPerPlayer + 1))}
                label="+"
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-neutral-400">Board theme</span>
          <div className="grid grid-cols-5 gap-2">
            {BOARD_THEMES.map((t) => (
              <ThemeSwatch key={t.id} theme={t} selected={t.id === theme.id} onClick={() => onThemeChange(t.id)} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-neutral-400">Piece style</span>
          <div className="grid grid-cols-2 gap-2">
            {PIECE_STYLES.map((style) => (
              <PieceStyleOption
                key={style.id}
                style={style}
                selected={style.id === pieceStyle.id}
                onClick={() => onPieceStyleChange(style.id)}
              />
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg bg-neutral-700 py-2 font-semibold hover:bg-neutral-600"
        >
          Resume
        </button>
      </div>
    </div>
  );
}

function ThemeSwatch({
  theme,
  selected,
  onClick,
}: {
  theme: BoardTheme;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={theme.name}
      className={[
        "h-9 w-9 rounded-md overflow-hidden ring-2",
        selected ? "ring-emerald-400" : "ring-transparent",
      ].join(" ")}
    >
      <div className="grid h-full w-full grid-cols-2 grid-rows-2">
        <div style={{ background: theme.swatchLight }} />
        <div style={{ background: theme.swatchDark }} />
        <div style={{ background: theme.swatchDark }} />
        <div style={{ background: theme.swatchLight }} />
      </div>
    </button>
  );
}

function PieceStyleOption({
  style,
  selected,
  onClick,
}: {
  style: PieceStyle;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center justify-center gap-2 rounded-lg px-2 py-1.5 ring-1 transition-colors",
        selected ? "bg-emerald-600 ring-emerald-500" : "bg-neutral-700 ring-neutral-600 hover:bg-neutral-600",
      ].join(" ")}
    >
      <span
        className="text-xl leading-none"
        style={{
          color: style.whiteFill,
          WebkitTextStroke: `1.5px ${style.whiteStroke}`,
          fontVariantEmoji: "text",
        }}
      >
        ♔
      </span>
      <span
        className="text-xl leading-none"
        style={{
          color: style.blackFill,
          WebkitTextStroke: `1px ${style.blackStroke}`,
          fontVariantEmoji: "text",
        }}
      >
        ♚
      </span>
      <span className="text-xs text-neutral-100">{style.name}</span>
    </button>
  );
}

function StepButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-6 w-6 rounded-full bg-neutral-700 text-neutral-100 hover:bg-neutral-600 flex items-center justify-center font-bold text-sm"
    >
      {label}
    </button>
  );
}
