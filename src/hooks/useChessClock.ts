"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Side = "w" | "b";

export interface ChessClockState {
  remainingMs: Record<Side, number>;
  activeSide: Side | null;
  isRunning: boolean;
}

interface UseChessClockOptions {
  initialBaseMs: number;
  onFlag: (side: Side) => void;
}

const TICK_MS = 100;

export function useChessClock({ initialBaseMs, onFlag }: UseChessClockOptions) {
  const remainingRef = useRef<Record<Side, number>>({ w: initialBaseMs, b: initialBaseMs });
  const activeSideRef = useRef<Side | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onFlagRef = useRef(onFlag);

  useEffect(() => {
    onFlagRef.current = onFlag;
  }, [onFlag]);

  const [state, setState] = useState<ChessClockState>(() => ({
    remainingMs: { w: initialBaseMs, b: initialBaseMs },
    activeSide: null,
    isRunning: false,
  }));

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const publish = useCallback((isRunning: boolean) => {
    setState({
      remainingMs: { ...remainingRef.current },
      activeSide: activeSideRef.current,
      isRunning,
    });
  }, []);

  const tick = useCallback(() => {
    const side = activeSideRef.current;
    if (!side) return;
    const next = Math.max(0, remainingRef.current[side] - TICK_MS);
    remainingRef.current[side] = next;
    if (next <= 0) {
      activeSideRef.current = null;
      stopInterval();
      publish(false);
      onFlagRef.current(side);
      return;
    }
    publish(true);
  }, [publish, stopInterval]);

  const startInterval = useCallback(() => {
    stopInterval();
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [stopInterval, tick]);

  const start = useCallback(
    (side: Side) => {
      activeSideRef.current = side;
      startInterval();
      publish(true);
    },
    [publish, startInterval]
  );

  const switchTurn = useCallback(
    (sideThatMoved: Side, incrementMs: number) => {
      remainingRef.current[sideThatMoved] += incrementMs;
      const nextSide: Side = sideThatMoved === "w" ? "b" : "w";
      activeSideRef.current = nextSide;
      startInterval();
      publish(true);
    },
    [publish, startInterval]
  );

  const pause = useCallback(() => {
    stopInterval();
    activeSideRef.current = null;
    publish(false);
  }, [publish, stopInterval]);

  const resetClock = useCallback(
    (baseMs: number) => {
      stopInterval();
      remainingRef.current = { w: baseMs, b: baseMs };
      activeSideRef.current = null;
      publish(false);
    },
    [publish, stopInterval]
  );

  const restoreState = useCallback(
    (remainingMs: Record<Side, number>, activeSide: Side) => {
      remainingRef.current = { ...remainingMs };
      activeSideRef.current = activeSide;
      startInterval();
      publish(true);
    },
    [publish, startInterval]
  );

  useEffect(() => stopInterval, [stopInterval]);

  return { ...state, start, switchTurn, pause, resetClock, restoreState };
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
