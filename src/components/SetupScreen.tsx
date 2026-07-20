"use client";

import { useState } from "react";
import type { LeaderboardEntry, MatchRecord } from "@/lib/db";
import RecentMatches from "./RecentMatches";
import HighScoreBoard from "./HighScoreBoard";

export interface SetupResult {
  whiteName: string;
  blackName: string;
  baseMinutes: number;
  incrementSeconds: number;
}

interface SetupScreenProps {
  onStart: (result: SetupResult) => void;
  recentMatches: MatchRecord[];
  leaderboard: LeaderboardEntry[];
  maxUndosPerPlayer: number;
  onMaxUndosPerPlayerChange: (value: number) => void;
}

const PRESETS: { label: string; baseMinutes: number; incrementSeconds: number }[] = [
  { label: "3 | 2", baseMinutes: 3, incrementSeconds: 2 },
  { label: "5 | 3", baseMinutes: 5, incrementSeconds: 3 },
  { label: "10 | 0", baseMinutes: 10, incrementSeconds: 0 },
  { label: "15 | 10", baseMinutes: 15, incrementSeconds: 10 },
];

export default function SetupScreen({
  onStart,
  recentMatches,
  leaderboard,
  maxUndosPerPlayer,
  onMaxUndosPerPlayerChange,
}: SetupScreenProps) {
  const [whiteName, setWhiteName] = useState("Player 1");
  const [blackName, setBlackName] = useState("Player 2");
  const [baseMinutes, setBaseMinutes] = useState(5);
  const [incrementSeconds, setIncrementSeconds] = useState(3);
  const [selectedPreset, setSelectedPreset] = useState<string | null>("5 | 3");

  function choosePreset(preset: (typeof PRESETS)[number]) {
    setBaseMinutes(preset.baseMinutes);
    setIncrementSeconds(preset.incrementSeconds);
    setSelectedPreset(preset.label);
  }

  function adjustMinutes(delta: number) {
    setBaseMinutes((m) => Math.min(60, Math.max(1, m + delta)));
    setSelectedPreset(null);
  }

  function adjustIncrement(delta: number) {
    setIncrementSeconds((s) => Math.min(60, Math.max(0, s + delta)));
    setSelectedPreset(null);
  }

  function adjustMaxUndos(delta: number) {
    onMaxUndosPerPlayerChange(Math.min(10, Math.max(0, maxUndosPerPlayer + delta)));
  }

  return (
    <div className="flex w-full h-full max-w-4xl gap-6 px-4 py-3 text-neutral-50 overflow-y-auto">
      <div className="flex flex-1 flex-col justify-center gap-3 min-w-0">
        <h1 className="text-lg font-bold tracking-tight">New Chess Match</h1>

        <div className="flex w-full gap-3">
          <label className="flex-1 flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wide text-neutral-400">White</span>
            <input
              value={whiteName}
              onChange={(e) => setWhiteName(e.target.value)}
              className="rounded-lg bg-neutral-800 px-3 py-1.5 text-neutral-50 outline-none ring-1 ring-neutral-700 focus:ring-emerald-500"
              maxLength={24}
            />
          </label>
          <label className="flex-1 flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wide text-neutral-400">Black</span>
            <input
              value={blackName}
              onChange={(e) => setBlackName(e.target.value)}
              className="rounded-lg bg-neutral-800 px-3 py-1.5 text-neutral-50 outline-none ring-1 ring-neutral-700 focus:ring-emerald-500"
              maxLength={24}
            />
          </label>
        </div>

        <div className="w-full flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-neutral-400">Time control</span>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => choosePreset(preset)}
                className={[
                  "rounded-lg py-1.5 text-sm font-semibold ring-1 transition-colors",
                  selectedPreset === preset.label
                    ? "bg-emerald-600 ring-emerald-500 text-white"
                    : "bg-neutral-800 ring-neutral-700 text-neutral-200 hover:bg-neutral-700",
                ].join(" ")}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg bg-neutral-800/60 px-4 py-2">
            <div className="flex flex-col items-center">
              <span className="text-xs text-neutral-400">minutes</span>
              <div className="flex items-center gap-2">
                <StepButton onClick={() => adjustMinutes(-1)} label="-" />
                <span className="w-8 text-center font-mono text-lg">{baseMinutes}</span>
                <StepButton onClick={() => adjustMinutes(1)} label="+" />
              </div>
            </div>
            <span className="text-neutral-500 text-xl">|</span>
            <div className="flex flex-col items-center">
              <span className="text-xs text-neutral-400">increment (s)</span>
              <div className="flex items-center gap-2">
                <StepButton onClick={() => adjustIncrement(-1)} label="-" />
                <span className="w-8 text-center font-mono text-lg">{incrementSeconds}</span>
                <StepButton onClick={() => adjustIncrement(1)} label="+" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg bg-neutral-800/60 px-4 py-2">
          <span className="text-xs text-neutral-400">
            undos per player
            <br />
            <span className="text-[10px] text-neutral-500">also adjustable in the in-game menu</span>
          </span>
          <div className="flex items-center gap-2">
            <StepButton onClick={() => adjustMaxUndos(-1)} label="-" />
            <span className="w-8 text-center font-mono text-lg">{maxUndosPerPlayer}</span>
            <StepButton onClick={() => adjustMaxUndos(1)} label="+" />
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onStart({
              whiteName: whiteName.trim() || "Player 1",
              blackName: blackName.trim() || "Player 2",
              baseMinutes,
              incrementSeconds,
            })
          }
          className="w-full rounded-lg bg-emerald-600 py-2 text-lg font-bold text-white hover:bg-emerald-500 transition-colors"
        >
          Start Game
        </button>
      </div>

      <div className="w-64 shrink-0 flex flex-col justify-center gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-neutral-400">High scores</span>
          <HighScoreBoard entries={leaderboard} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-neutral-400">Recent games</span>
          <RecentMatches matches={recentMatches} />
        </div>
      </div>
    </div>
  );
}

function StepButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-7 w-7 rounded-full bg-neutral-700 text-neutral-100 hover:bg-neutral-600 flex items-center justify-center font-bold"
    >
      {label}
    </button>
  );
}
