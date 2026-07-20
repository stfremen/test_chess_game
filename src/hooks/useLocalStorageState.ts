"use client";

import { useEffect, useState } from "react";

export function useLocalStorageState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // One-time hydration from localStorage, which doesn't exist during SSR:
      // state must start at defaultValue so server and client markup match,
      // then sync from storage once mounted. A single extra render here is
      // the intended tradeoff, not an accidental derived-state cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw !== null) setValue(JSON.parse(raw));
    } catch {
      // ignore malformed/inaccessible storage
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage write failures (private mode, quota, etc.)
    }
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}
