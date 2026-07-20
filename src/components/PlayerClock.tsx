"use client";

import { formatClock } from "@/hooks/useChessClock";

interface PlayerClockProps {
  name: string;
  remainingMs: number;
  isActive: boolean;
  isFlagged: boolean;
  align: "left" | "right";
}

export default function PlayerClock({ name, remainingMs, isActive, isFlagged, align }: PlayerClockProps) {
  const low = remainingMs < 30_000;

  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-6 w-36 sm:w-44",
        isActive ? "bg-emerald-600/20 ring-2 ring-emerald-500" : "bg-neutral-800/60",
        align === "left" ? "items-start pl-6" : "items-end pr-6",
      ].join(" ")}
    >
      <span className="text-sm sm:text-base font-medium text-neutral-300 truncate max-w-full">
        {name}
      </span>
      <span
        className={[
          "font-mono font-bold tabular-nums",
          "text-3xl sm:text-4xl",
          isFlagged ? "text-red-500" : low ? "text-red-400" : "text-neutral-50",
        ].join(" ")}
      >
        {formatClock(remainingMs)}
      </span>
    </div>
  );
}
