export function elapsedMs(since: number | null): number {
  if (since === null) return 0;
  return Date.now() - since;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function nowId(): number {
  return -Date.now();
}
